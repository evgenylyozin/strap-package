export type ToolInfo = {
  name: string;
  supplementary: string[];
  isDev: boolean;
};
export type Setup = {
  language: ToolInfo;
  testRunner: ToolInfo;
  linter: ToolInfo;
  formatter: ToolInfo;
  buildTool: ToolInfo;
  hooksTool: ToolInfo;
};
// only settings which are customizable
export type S = {
  name: string;
  target: "node" | "web";
};
export interface FolderGiver {
  getFolder: () => string;
}

export type LogType =
  | "error"
  | "warning"
  | "success"
  | "info"
  | "header"
  | "subHeader";
