import * as vscode from 'vscode';
import { SmartPasteController } from './controllers/SmartPasteController';
import { Logger } from './utils/Logger';

let smartPasteController: SmartPasteController;

export function activate(context: vscode.ExtensionContext) {
    Logger.info('SmartPaste расширение активировано');

    // Инициализируем контроллер
    smartPasteController = new SmartPasteController();

    // Регистрируем команду Smart Paste
    const disposable = vscode.commands.registerCommand('smartpaste.smartPaste', async () => {
        try {
            await smartPasteController.smartPaste();
        } catch (error) {
            Logger.error('Ошибка при выполнении Smart Paste:', error);
            vscode.window.showErrorMessage(
                'Не удалось выполнить умную вставку. Проверьте настройки проекта.'
            );
        }
    });

    context.subscriptions.push(disposable);

    // Показываем приветственное сообщение при первом запуске
    const isFirstRun = context.globalState.get('smartpaste.firstRun', true);
    if (isFirstRun) {
        vscode.window.showInformationMessage(
            'SmartPaste готов к работе! Используйте Ctrl+Shift+V или правый клик → Smart Paste',
            'Понятно'
        );
        context.globalState.update('smartpaste.firstRun', false);
    }
}

export function deactivate() {
    Logger.info('SmartPaste расширение деактивировано');
    if (smartPasteController) {
        smartPasteController.dispose();
    }
} 