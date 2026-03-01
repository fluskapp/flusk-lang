export interface ExplodedFile {
  path: string;
  content: string;
  type: string;
}

export interface ExplodedFiles {
  files: ExplodedFile[];
  feature: string;
}
