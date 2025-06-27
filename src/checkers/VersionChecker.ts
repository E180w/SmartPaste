import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LibraryInfo, VersionConflict } from '../types';
import { Logger } from '../utils/Logger';

export class VersionChecker {
    
    async checkVersions(libraries: LibraryInfo[], document: vscode.TextDocument): Promise<VersionConflict[]> {
        Logger.info('Проверяем версии библиотек');
        
        const conflicts: VersionConflict[] = [];
        
        try {
            const workspaceRoot = this.getWorkspaceRoot(document);
            if (!workspaceRoot) {
                Logger.warn('Не найден корень рабочей области');
                return conflicts;
            }
            
            // Проверяем package.json для JS/TS проектов
            const packageJsonPath = path.join(workspaceRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJsonConflicts = await this.checkPackageJson(libraries, packageJsonPath);
                conflicts.push(...packageJsonConflicts);
            }
            
            // Проверяем requirements.txt для Python проектов
            const requirementsPath = path.join(workspaceRoot, 'requirements.txt');
            if (fs.existsSync(requirementsPath)) {
                const requirementsConflicts = await this.checkRequirementsTxt(libraries, requirementsPath);
                conflicts.push(...requirementsConflicts);
            }
            
            // Показываем предупреждения о конфликтах
            if (conflicts.length > 0) {
                this.showVersionWarnings(conflicts);
            }
            
            return conflicts;
        } catch (error) {
            Logger.error('Ошибка при проверке версий:', error);
            return conflicts;
        }
    }

    private getWorkspaceRoot(document: vscode.TextDocument): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }
        
        // Находим рабочую область, содержащую текущий документ
        const documentPath = document.uri.fsPath;
        for (const folder of workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            if (documentPath.startsWith(folderPath)) {
                return folderPath;
            }
        }
        
        // Возвращаем первую рабочую область как fallback
        return workspaceFolders[0].uri.fsPath;
    }

    private async checkPackageJson(libraries: LibraryInfo[], packageJsonPath: string): Promise<VersionConflict[]> {
        const conflicts: VersionConflict[] = [];
        
        try {
            const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent);
            
            const dependencies = {
                ...packageJson.dependencies || {},
                ...packageJson.devDependencies || {}
            };
            
            for (const library of libraries) {
                const installedVersion = dependencies[library.name];
                
                if (installedVersion && library.version) {
                    const isCompatible = this.checkVersionCompatibility(library.version, installedVersion);
                    
                    if (!isCompatible) {
                        conflicts.push({
                            library: library.name,
                            requiredVersion: library.version,
                            currentVersion: installedVersion,
                            isCompatible: false
                        });
                    }
                }
            }
        } catch (error) {
            Logger.error('Ошибка при чтении package.json:', error);
        }
        
        return conflicts;
    }

    private async checkRequirementsTxt(libraries: LibraryInfo[], requirementsPath: string): Promise<VersionConflict[]> {
        const conflicts: VersionConflict[] = [];
        
        try {
            const requirementsContent = fs.readFileSync(requirementsPath, 'utf8');
            const lines = requirementsContent.split('\n');
            
            const installedLibraries: { [key: string]: string } = {};
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const match = trimmed.match(/^([a-zA-Z0-9_-]+)([>=<~!]+)(.+)$/);
                    if (match) {
                        installedLibraries[match[1]] = match[3];
                    }
                }
            }
            
            for (const library of libraries) {
                const installedVersion = installedLibraries[library.name];
                
                if (installedVersion && library.version) {
                    const isCompatible = this.checkVersionCompatibility(library.version, installedVersion);
                    
                    if (!isCompatible) {
                        conflicts.push({
                            library: library.name,
                            requiredVersion: library.version,
                            currentVersion: installedVersion,
                            isCompatible: false
                        });
                    }
                }
            }
        } catch (error) {
            Logger.error('Ошибка при чтении requirements.txt:', error);
        }
        
        return conflicts;
    }

    private checkVersionCompatibility(requiredVersion: string, installedVersion: string): boolean {
        // Упрощенная проверка совместимости версий
        // В реальном проекте стоит использовать более сложную логику
        
        try {
            const required = this.parseVersion(requiredVersion);
            const installed = this.parseVersion(installedVersion);
            
            // Проверяем совместимость major.minor версий
            return required.major === installed.major && required.minor <= installed.minor;
        } catch (error) {
            Logger.warn('Не удалось проверить совместимость версий:', error);
            return true; // Предполагаем совместимость при ошибке парсинга
        }
    }

    private parseVersion(version: string): { major: number, minor: number, patch: number } {
        // Очищаем версию от операторов сравнения
        const cleanVersion = version.replace(/[^0-9.]/g, '');
        const parts = cleanVersion.split('.').map(part => parseInt(part, 10) || 0);
        
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0
        };
    }

    private showVersionWarnings(conflicts: VersionConflict[]): void {
        const messages = conflicts.map(conflict => 
            `${conflict.library}: требуется ${conflict.requiredVersion}, установлена ${conflict.currentVersion}`
        );
        
        const fullMessage = `Обнаружены потенциальные конфликты версий:\n${messages.join('\n')}`;
        
        vscode.window.showWarningMessage(
            'Обнаружены конфликты версий библиотек',
            'Подробности'
        ).then(selection => {
            if (selection === 'Подробности') {
                vscode.window.showInformationMessage(fullMessage);
            }
        });
    }
} 