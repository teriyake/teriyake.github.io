export interface FSNode {
    type: 'folder' | 'file' | 'link' | 'error' | 'program' | 'music';
    content?: string | FSNodeMap;
    url?: string;
    icon: string;
    contentPath?: string;
    audioSrc?: string;
    coverArtUrl?: string;
}

export interface FSNodeMap {
    [key: string]: FSNode;
}
