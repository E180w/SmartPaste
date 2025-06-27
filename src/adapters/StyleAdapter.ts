import { ProjectStyle } from '../types';
import { Logger } from '../utils/Logger';

export class StyleAdapter {
    
    async adaptStyle(code: string, projectStyle: ProjectStyle, languageId: string): Promise<string> {
        Logger.info('Адаптируем стиль кода');
        
        try {
            let adaptedCode = code;
            
            // Адаптируем отступы
            adaptedCode = this.adaptIndentation(adaptedCode, projectStyle);
            
            // Адаптируем кавычки
            adaptedCode = this.adaptQuotes(adaptedCode, projectStyle);
            
            // Адаптируем точки с запятой (для JS/TS)
            if (languageId === 'javascript' || languageId === 'typescript') {
                adaptedCode = this.adaptSemicolons(adaptedCode, projectStyle);
            }
            
            Logger.info('Стиль кода адаптирован');
            return adaptedCode;
        } catch (error) {
            Logger.error('Ошибка при адаптации стиля:', error);
            return code; // Возвращаем оригинальный код при ошибке
        }
    }

    private adaptIndentation(code: string, style: ProjectStyle): string {
        const lines = code.split('\n');
        const adaptedLines: string[] = [];
        
        for (const line of lines) {
            if (line.trim() === '') {
                adaptedLines.push('');
                continue;
            }
            
            // Определяем уровень отступа
            const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
            let indentLevel = 0;
            
            if (leadingWhitespace.includes('\t')) {
                indentLevel = leadingWhitespace.length;
            } else {
                indentLevel = Math.floor(leadingWhitespace.length / 4); // Предполагаем 4 пробела = 1 уровень
            }
            
            // Создаем новый отступ
            let newIndent = '';
            if (style.indentation === 'tabs') {
                newIndent = '\t'.repeat(indentLevel);
            } else {
                newIndent = ' '.repeat(indentLevel * style.indentSize);
            }
            
            // Заменяем отступ
            const trimmedLine = line.trim();
            adaptedLines.push(newIndent + trimmedLine);
        }
        
        return adaptedLines.join('\n');
    }

    private adaptQuotes(code: string, style: ProjectStyle): string {
        const targetQuote = style.quotesStyle === 'single' ? "'" : '"';
        const sourceQuote = style.quotesStyle === 'single' ? '"' : "'";
        
        // Простая замена кавычек (можно улучшить для более сложных случаев)
        return code.replace(
            new RegExp(`${sourceQuote}([^${sourceQuote}]*?)${sourceQuote}`, 'g'),
            `${targetQuote}$1${targetQuote}`
        );
    }

    private adaptSemicolons(code: string, style: ProjectStyle): string {
        const lines = code.split('\n');
        const adaptedLines: string[] = [];
        
        for (const line of lines) {
            let adaptedLine = line;
            const trimmed = line.trim();
            
            // Пропускаем комментарии и пустые строки
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
                adaptedLines.push(line);
                continue;
            }
            
            // Если проект использует точки с запятой
            if (style.semicolons) {
                // Добавляем точку с запятой если её нет
                if (!trimmed.endsWith(';') && 
                    !trimmed.endsWith('{') && 
                    !trimmed.endsWith('}') && 
                    !trimmed.includes('if ') &&
                    !trimmed.includes('for ') &&
                    !trimmed.includes('while ') &&
                    !trimmed.includes('else')) {
                    adaptedLine = line.trimEnd() + ';';
                }
            } else {
                // Убираем точки с запятой
                if (trimmed.endsWith(';')) {
                    adaptedLine = line.replace(/;$/, '');
                }
            }
            
            adaptedLines.push(adaptedLine);
        }
        
        return adaptedLines.join('\n');
    }
} 