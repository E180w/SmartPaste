import * as vscode from 'vscode';
import { Logger } from '../utils/Logger';
import { CodeAnalyzer } from '../analyzers/CodeAnalyzer';
import { StyleAdapter } from '../adapters/StyleAdapter';
import { ImportManager } from '../managers/ImportManager';
import { VariableRenamer } from '../renamers/VariableRenamer';
import { VersionChecker } from '../checkers/VersionChecker';

export class SmartPasteController {
    private codeAnalyzer: CodeAnalyzer;
    private styleAdapter: StyleAdapter;
    private importManager: ImportManager;
    private variableRenamer: VariableRenamer;
    private versionChecker: VersionChecker;

    constructor() {
        this.codeAnalyzer = new CodeAnalyzer();
        this.styleAdapter = new StyleAdapter();
        this.importManager = new ImportManager();
        this.variableRenamer = new VariableRenamer();
        this.versionChecker = new VersionChecker();
    }

    async smartPaste(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Нет активного редактора');
            return;
        }

        try {
            // Получаем содержимое буфера обмена
            const clipboardText = await vscode.env.clipboard.readText();
            if (!clipboardText.trim()) {
                vscode.window.showWarningMessage('Буфер обмена пуст');
                return;
            }

            Logger.info('Начинаем умную вставку');
            
            // Определяем язык текущего файла
            const languageId = editor.document.languageId;
            Logger.info(`Язык файла: ${languageId}`);

            // Проверяем поддержку языка
            if (!this.isSupportedLanguage(languageId)) {
                vscode.window.showWarningMessage(
                    `Язык ${languageId} пока не поддерживается. Поддерживаются: Python, JavaScript, TypeScript`
                );
                await this.fallbackPaste(editor, clipboardText);
                return;
            }

            // Анализируем код в буфере обмена
            const codeInfo = await this.codeAnalyzer.analyzeCode(clipboardText, languageId);
            
            // Анализируем стиль проекта
            const projectStyle = await this.codeAnalyzer.analyzeProjectStyle(editor.document);

            // Адаптируем стиль кода
            let adaptedCode = await this.styleAdapter.adaptStyle(clipboardText, projectStyle, languageId);

            // Переименовываем переменные
            adaptedCode = await this.variableRenamer.renameVariables(adaptedCode, projectStyle, languageId);

            // Добавляем импорты
            const codeWithImports = await this.importManager.addImports(
                adaptedCode, 
                codeInfo.requiredImports, 
                editor.document, 
                languageId
            );

            // Проверяем версии библиотек
            await this.versionChecker.checkVersions(codeInfo.libraries, editor.document);

            // Вставляем адаптированный код
            await this.insertCode(editor, codeWithImports.code);

            // Добавляем импорты в начало файла если нужно
            if (codeWithImports.importsToAdd.length > 0) {
                await this.insertImports(editor, codeWithImports.importsToAdd);
            }

            Logger.info('Умная вставка завершена успешно');
            vscode.window.showInformationMessage('Код успешно адаптирован и вставлен!');

        } catch (error) {
            Logger.error('Ошибка при умной вставке:', error);
            
            // Fallback к обычной вставке
            try {
                const clipboardText = await vscode.env.clipboard.readText();
                await this.fallbackPaste(editor, clipboardText);
                vscode.window.showWarningMessage(
                    'Не удалось адаптировать код автоматически. Выполнена обычная вставка.'
                );
            } catch (fallbackError) {
                Logger.error('Ошибка при fallback вставке:', fallbackError);
                vscode.window.showErrorMessage('Не удалось выполнить вставку кода');
            }
        }
    }

    private isSupportedLanguage(languageId: string): boolean {
        const supportedLanguages = ['python', 'javascript', 'typescript'];
        return supportedLanguages.includes(languageId);
    }

    private async fallbackPaste(editor: vscode.TextEditor, text: string): Promise<void> {
        const position = editor.selection.active;
        await editor.edit(editBuilder => {
            editBuilder.insert(position, text);
        });
    }

    private async insertCode(editor: vscode.TextEditor, code: string): Promise<void> {
        const position = editor.selection.active;
        await editor.edit(editBuilder => {
            editBuilder.insert(position, code);
        });
    }

    private async insertImports(editor: vscode.TextEditor, imports: string[]): Promise<void> {
        const document = editor.document;
        let insertPosition = new vscode.Position(0, 0);

        // Ищем место для вставки импортов
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const trimmedText = line.text.trim();
            
            // Пропускаем комментарии и пустые строки в начале файла
            if (trimmedText === '' || trimmedText.startsWith('#') || trimmedText.startsWith('//')) {
                insertPosition = new vscode.Position(i + 1, 0);
                continue;
            }
            
            // Если это уже импорт, найдем место после всех импортов
            if (trimmedText.startsWith('import ') || trimmedText.startsWith('from ') || 
                trimmedText.startsWith('const ') || trimmedText.startsWith('require(')) {
                insertPosition = new vscode.Position(i + 1, 0);
                continue;
            }
            
            break;
        }

        // Вставляем импорты
        await editor.edit(editBuilder => {
            const importsText = imports.join('\n') + '\n';
            editBuilder.insert(insertPosition, importsText);
        });
    }

    dispose(): void {
        // Очистка ресурсов если необходимо
        Logger.info('SmartPasteController disposed');
    }
} 