import * as vscode from 'vscode';
import * as path from 'path';
import { CodeInfo, ProjectStyle, LibraryInfo } from '../types';
import { Logger } from '../utils/Logger';

export class CodeAnalyzer {
    
    async analyzeCode(code: string, languageId: string): Promise<CodeInfo> {
        Logger.info(`Анализируем код на языке: ${languageId}`);
        
        const codeInfo: CodeInfo = {
            requiredImports: [],
            libraries: [],
            variables: [],
            functions: [],
            language: languageId
        };

        try {
            switch (languageId) {
                case 'python':
                    return this.analyzePythonCode(code, codeInfo);
                case 'javascript':
                case 'typescript':
                    return this.analyzeJavaScriptCode(code, codeInfo);
                default:
                    Logger.warn(`Неподдерживаемый язык: ${languageId}`);
                    return codeInfo;
            }
        } catch (error) {
            Logger.error('Ошибка при анализе кода:', error);
            return codeInfo;
        }
    }

    async analyzeProjectStyle(document: vscode.TextDocument): Promise<ProjectStyle> {
        Logger.info('Анализируем стиль проекта');
        
        const style: ProjectStyle = {
            indentation: 'spaces',
            indentSize: 4,
            variableNaming: 'camelCase',
            quotesStyle: 'single',
            semicolons: true,
            trailingCommas: false,
            language: document.languageId
        };

        try {
            // Анализируем отступы
            const indentationInfo = this.analyzeIndentation(document);
            style.indentation = indentationInfo.type;
            style.indentSize = indentationInfo.size;

            // Анализируем именование переменных
            style.variableNaming = this.analyzeVariableNaming(document);

            // Анализируем стиль кавычек
            style.quotesStyle = this.analyzeQuotesStyle(document);

            // Анализируем использование точек с запятой (для JS/TS)
            if (document.languageId === 'javascript' || document.languageId === 'typescript') {
                style.semicolons = this.analyzeSemicolonUsage(document);
                style.trailingCommas = this.analyzeTrailingCommas(document);
            }

            Logger.info('Стиль проекта проанализирован:', style);
            return style;
        } catch (error) {
            Logger.error('Ошибка при анализе стиля проекта:', error);
            return style;
        }
    }

    private analyzePythonCode(code: string, codeInfo: CodeInfo): CodeInfo {
        const lines = code.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Ищем импорты
            if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
                codeInfo.requiredImports.push(trimmed);
                
                // Извлекаем информацию о библиотеке
                const libraryInfo = this.extractPythonLibraryInfo(trimmed);
                if (libraryInfo) {
                    codeInfo.libraries.push(libraryInfo);
                }
            }
            
            // Ищем функции
            const funcMatch = trimmed.match(/^def\s+(\w+)\s*\(/);
            if (funcMatch) {
                codeInfo.functions.push({
                    name: funcMatch[1],
                    parameters: [],
                    line: 0,
                    column: 0
                });
            }
        }
        
        return codeInfo;
    }

    private analyzeJavaScriptCode(code: string, codeInfo: CodeInfo): CodeInfo {
        const lines = code.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Ищем импорты
            if (trimmed.startsWith('import ') || trimmed.includes('require(')) {
                codeInfo.requiredImports.push(trimmed);
                
                // Извлекаем информацию о библиотеке
                const libraryInfo = this.extractJavaScriptLibraryInfo(trimmed);
                if (libraryInfo) {
                    codeInfo.libraries.push(libraryInfo);
                }
            }
            
            // Ищем функции
            const funcMatch = trimmed.match(/(?:function\s+(\w+)|(\w+)\s*[=:]\s*(?:function|\())/);
            if (funcMatch) {
                const funcName = funcMatch[1] || funcMatch[2];
                if (funcName) {
                    codeInfo.functions.push({
                        name: funcName,
                        parameters: [],
                        line: 0,
                        column: 0
                    });
                }
            }
        }
        
        return codeInfo;
    }

    private extractPythonLibraryInfo(importStatement: string): LibraryInfo | null {
        // import numpy as np
        let match = importStatement.match(/^import\s+(\w+)/);
        if (match) {
            return {
                name: match[1],
                importStatement: importStatement
            };
        }
        
        // from requests import get
        match = importStatement.match(/^from\s+(\w+)\s+import/);
        if (match) {
            return {
                name: match[1],
                importStatement: importStatement
            };
        }
        
        return null;
    }

    private extractJavaScriptLibraryInfo(importStatement: string): LibraryInfo | null {
        // import { something } from 'library'
        let match = importStatement.match(/from\s+['"]([^'"]+)['"]/);
        if (match) {
            return {
                name: match[1],
                importStatement: importStatement
            };
        }
        
        // const lib = require('library')
        match = importStatement.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (match) {
            return {
                name: match[1],
                importStatement: importStatement
            };
        }
        
        return null;
    }

    private analyzeIndentation(document: vscode.TextDocument): { type: 'tabs' | 'spaces', size: number } {
        let tabCount = 0;
        let spaceCount = 0;
        let spaceSize = 4;
        
        for (let i = 0; i < Math.min(document.lineCount, 100); i++) {
            const line = document.lineAt(i);
            const text = line.text;
            
            if (text.startsWith('\t')) {
                tabCount++;
            } else if (text.startsWith(' ')) {
                spaceCount++;
                // Определяем размер отступа
                const leadingSpaces = text.match(/^ +/);
                if (leadingSpaces && leadingSpaces[0].length < spaceSize) {
                    spaceSize = leadingSpaces[0].length;
                }
            }
        }
        
        return {
            type: tabCount > spaceCount ? 'tabs' : 'spaces',
            size: spaceSize
        };
    }

    private analyzeVariableNaming(document: vscode.TextDocument): 'camelCase' | 'snake_case' | 'PascalCase' {
        let camelCaseCount = 0;
        let snakeCaseCount = 0;
        let pascalCaseCount = 0;
        
        for (let i = 0; i < Math.min(document.lineCount, 100); i++) {
            const line = document.lineAt(i);
            const text = line.text;
            
            // Ищем объявления переменных
            const varMatches = text.match(/\b(\w+)\s*[=:]/g);
            if (varMatches) {
                for (const match of varMatches) {
                    const varName = match.split(/[=:]/)[0].trim();
                    
                    if (/^[a-z][a-zA-Z0-9]*$/.test(varName) && /[A-Z]/.test(varName)) {
                        camelCaseCount++;
                    } else if (/^[a-z][a-z0-9_]*$/.test(varName) && /_/.test(varName)) {
                        snakeCaseCount++;
                    } else if (/^[A-Z][a-zA-Z0-9]*$/.test(varName)) {
                        pascalCaseCount++;
                    }
                }
            }
        }
        
        if (snakeCaseCount > camelCaseCount && snakeCaseCount > pascalCaseCount) {
            return 'snake_case';
        } else if (pascalCaseCount > camelCaseCount) {
            return 'PascalCase';
        }
        
        return 'camelCase';
    }

    private analyzeQuotesStyle(document: vscode.TextDocument): 'single' | 'double' {
        let singleQuoteCount = 0;
        let doubleQuoteCount = 0;
        
        for (let i = 0; i < Math.min(document.lineCount, 50); i++) {
            const line = document.lineAt(i);
            const text = line.text;
            
            singleQuoteCount += (text.match(/'/g) || []).length;
            doubleQuoteCount += (text.match(/"/g) || []).length;
        }
        
        return singleQuoteCount > doubleQuoteCount ? 'single' : 'double';
    }

    private analyzeSemicolonUsage(document: vscode.TextDocument): boolean {
        let linesWithSemicolon = 0;
        let totalLines = 0;
        
        for (let i = 0; i < Math.min(document.lineCount, 50); i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();
            
            if (text && !text.startsWith('//') && !text.startsWith('/*')) {
                totalLines++;
                if (text.endsWith(';')) {
                    linesWithSemicolon++;
                }
            }
        }
        
        return totalLines > 0 && linesWithSemicolon / totalLines > 0.5;
    }

    private analyzeTrailingCommas(document: vscode.TextDocument): boolean {
        let trailingCommaCount = 0;
        let totalObjectsArrays = 0;
        
        for (let i = 0; i < Math.min(document.lineCount, 50); i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();
            
            if (text.endsWith('}') || text.endsWith(']')) {
                totalObjectsArrays++;
                const prevLineIndex = i - 1;
                if (prevLineIndex >= 0) {
                    const prevLine = document.lineAt(prevLineIndex);
                    if (prevLine.text.trim().endsWith(',')) {
                        trailingCommaCount++;
                    }
                }
            }
        }
        
        return totalObjectsArrays > 0 && trailingCommaCount / totalObjectsArrays > 0.5;
    }
} 