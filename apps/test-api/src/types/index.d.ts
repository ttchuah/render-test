// This tells TS that these declarations should be globally available throughout the project.
declare global {

    declare module 'Express' {
        
        interface Request {
            decoded?: any;
        }
    }
}

