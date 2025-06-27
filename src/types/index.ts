export interface CodeInfo {
    requiredImports: string[];
    libraries: LibraryInfo[];
    variables: VariableInfo[];
    functions: FunctionInfo[];
    language: string;
}

export interface LibraryInfo {
    name: string;
    version?: string;
    importStatement: string;
}

export interface VariableInfo {
    name: string;
    type?: string;
    line: number;
    column: number;
}

export interface FunctionInfo {
    name: string;
    parameters: string[];
    line: number;
    column: number;
}

export interface ProjectStyle {
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    variableNaming: 'camelCase' | 'snake_case' | 'PascalCase';
    quotesStyle: 'single' | 'double';
    semicolons: boolean;
    trailingCommas: boolean;
    language: string;
}

export interface ImportResult {
    code: string;
    importsToAdd: string[];
}

export interface VersionConflict {
    library: string;
    requiredVersion: string;
    currentVersion: string;
    isCompatible: boolean;
} 