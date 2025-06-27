import { ProjectStyle } from '../types';
import { Logger } from '../utils/Logger';

export class VariableRenamer {
    
    async renameVariables(code: string, projectStyle: ProjectStyle, languageId: string): Promise<string> {
        Logger.info('Переименовываем переменные под стиль проекта');
        
        try {
            const targetNaming = projectStyle.variableNaming;
            Logger.info(`Целевой стиль именования: ${targetNaming}`);
            
            return this.convertVariableNaming(code, targetNaming);
        } catch (error) {
            Logger.error('Ошибка при переименовании переменных:', error);
            return code; // Возвращаем оригинальный код при ошибке
        }
    }

    private convertVariableNaming(code: string, targetNaming: 'camelCase' | 'snake_case' | 'PascalCase'): string {
        const lines = code.split('\n');
        const convertedLines: string[] = [];
        
        for (const line of lines) {
            let convertedLine = line;
            
            // Находим все переменные в строке
            const variableMatches = line.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
            
            if (variableMatches) {
                for (const variable of variableMatches) {
                    // Пропускаем ключевые слова
                    if (this.isKeyword(variable)) {
                        continue;
                    }
                    
                    const convertedVariable = this.convertVariable(variable, targetNaming);
                    if (convertedVariable !== variable) {
                        // Заменяем переменную в строке (точное совпадение)
                        convertedLine = convertedLine.replace(
                            new RegExp(`\\b${this.escapeRegex(variable)}\\b`, 'g'),
                            convertedVariable
                        );
                    }
                }
            }
            
            convertedLines.push(convertedLine);
        }
        
        return convertedLines.join('\n');
    }

    private convertVariable(variable: string, targetNaming: 'camelCase' | 'snake_case' | 'PascalCase'): string {
        // Определяем текущий стиль переменной
        const currentStyle = this.detectVariableStyle(variable);
        
        if (currentStyle === targetNaming) {
            return variable; // Уже в нужном стиле
        }
        
        // Разбиваем переменную на части
        const parts = this.splitVariable(variable, currentStyle);
        
        // Конвертируем в целевой стиль
        return this.joinVariable(parts, targetNaming);
    }

    private detectVariableStyle(variable: string): 'camelCase' | 'snake_case' | 'PascalCase' | 'unknown' {
        if (/^[a-z][a-zA-Z0-9]*$/.test(variable) && /[A-Z]/.test(variable)) {
            return 'camelCase';
        } else if (/^[a-z][a-z0-9_]*$/.test(variable) && /_/.test(variable)) {
            return 'snake_case';
        } else if (/^[A-Z][a-zA-Z0-9]*$/.test(variable)) {
            return 'PascalCase';
        }
        
        return 'unknown';
    }

    private splitVariable(variable: string, style: 'camelCase' | 'snake_case' | 'PascalCase' | 'unknown'): string[] {
        switch (style) {
            case 'camelCase':
            case 'PascalCase':
                // Разделяем по заглавным буквам
                return variable.split(/(?=[A-Z])/).filter(part => part.length > 0);
            
            case 'snake_case':
                // Разделяем по подчеркиваниям
                return variable.split('_').filter(part => part.length > 0);
            
            default:
                return [variable];
        }
    }

    private joinVariable(parts: string[], targetStyle: 'camelCase' | 'snake_case' | 'PascalCase'): string {
        if (parts.length === 0) {
            return '';
        }
        
        switch (targetStyle) {
            case 'camelCase':
                return parts[0].toLowerCase() + 
                       parts.slice(1).map(part => this.capitalize(part.toLowerCase())).join('');
            
            case 'snake_case':
                return parts.map(part => part.toLowerCase()).join('_');
            
            case 'PascalCase':
                return parts.map(part => this.capitalize(part.toLowerCase())).join('');
            
            default:
                return parts.join('');
        }
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private isKeyword(word: string): boolean {
        // Ключевые слова Python
        const pythonKeywords = [
            'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
            'except', 'exec', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
            'lambda', 'not', 'or', 'pass', 'print', 'raise', 'return', 'try', 'while', 'with',
            'yield', 'True', 'False', 'None'
        ];
        
        // Ключевые слова JavaScript/TypeScript
        const jsKeywords = [
            'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
            'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function',
            'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'return', 'super',
            'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'void',
            'while', 'with', 'yield', 'async', 'await'
        ];
        
        const allKeywords = [...pythonKeywords, ...jsKeywords];
        return allKeywords.includes(word);
    }
} 