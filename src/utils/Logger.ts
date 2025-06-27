import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;

    static {
        this.outputChannel = vscode.window.createOutputChannel('SmartPaste');
    }

    static info(message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] INFO: ${message}`;
        console.log(logMessage, ...args);
        this.outputChannel.appendLine(logMessage);
    }

    static error(message: string, error?: any): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}`;
        console.error(logMessage, error);
        this.outputChannel.appendLine(logMessage);
        
        if (error) {
            this.outputChannel.appendLine(`Error details: ${error.toString()}`);
            if (error.stack) {
                this.outputChannel.appendLine(`Stack trace: ${error.stack}`);
            }
        }
    }

    static warn(message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] WARN: ${message}`;
        console.warn(logMessage, ...args);
        this.outputChannel.appendLine(logMessage);
    }

    static debug(message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] DEBUG: ${message}`;
        console.debug(logMessage, ...args);
        this.outputChannel.appendLine(logMessage);
    }

    static show(): void {
        this.outputChannel.show();
    }

    static dispose(): void {
        this.outputChannel.dispose();
    }
} 