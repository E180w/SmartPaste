import * as vscode from 'vscode';
import { ImportResult } from '../types';
import { Logger } from '../utils/Logger';

export class ImportManager {
    
    async addImports(
        code: string, 
        requiredImports: string[], 
        document: vscode.TextDocument, 
        _languageId: string
    ): Promise<ImportResult> {
        Logger.info('Добавляем необходимые импорты');
        
        try {
            const existingImports = this.getExistingImports(document);
            const missingImports = this.findMissingImports(requiredImports, existingImports);
            
            return {
                code: code,
                importsToAdd: missingImports
            };
        } catch (error) {
            Logger.error('Ошибка при добавлении импортов:', error);
            return {
                code: code,
                importsToAdd: []
            };
        }
    }

    private getExistingImports(document: vscode.TextDocument): string[] {
        const imports: string[] = [];
        
        for (let i = 0; i < Math.min(document.lineCount, 50); i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();
            
            // Python импорты
            if (text.startsWith('import ') || text.startsWith('from ')) {
                imports.push(text);
            }
            
            // JavaScript/TypeScript импорты
            if (text.startsWith('import ') || text.includes('require(')) {
                imports.push(text);
            }
        }
        
        return imports;
    }

    private findMissingImports(requiredImports: string[], existingImports: string[]): string[] {
        const missing: string[] = [];
        
        for (const required of requiredImports) {
            if (!this.isImportPresent(required, existingImports)) {
                missing.push(required);
            }
        }
        
        return missing;
    }

    private isImportPresent(requiredImport: string, existingImports: string[]): boolean {
        // Извлекаем имя библиотеки из импорта
        const requiredLibrary = this.extractLibraryName(requiredImport);
        
        for (const existing of existingImports) {
            const existingLibrary = this.extractLibraryName(existing);
            if (requiredLibrary === existingLibrary) {
                return true;
            }
        }
        
        return false;
    }

    private extractLibraryName(importStatement: string): string {
        // Python: import numpy, from requests import get
        let match = importStatement.match(/^(?:import|from)\s+(\w+)/);
        if (match) {
            return match[1];
        }
        
        // JavaScript/TypeScript: import ... from 'library', require('library')
        match = importStatement.match(/from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]/);
        if (match) {
            return match[1] || match[2];
        }
        
        return '';
    }
} 