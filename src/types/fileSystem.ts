export interface FSNode {
    type: 'folder' | 'file' | 'link' | 'error' | 'program';
    content?: string | FSNodeMap;
    url?: string;
    icon: string;
    contentPath?: string;
}

export interface FSNodeMap {
    [key: string]: FSNode;
}
