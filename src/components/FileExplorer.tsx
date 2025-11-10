import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import DegradableWindow from './DegradableWindow';
import ImageViewer from './ImageViewer';
import MusicPlayer from './MusicPlayer';
import type { FSNode, FSNodeMap } from '../types/fileSystem';

interface OpenWindow {
    id: number;
    title: string;
    content: React.ReactNode;
    position: { x: number; y: number };
    size: { width: number; height: number };
    degradationEnabled: boolean;
}

interface FileExplorerProps {
    initialPosition: { x: number; y: number };
    onClose: () => void;
}

const getNestedNode = (path: string[], fs: FSNode | null): FSNode | null => {
    if (!fs) return null;

    let currNode: FSNode | null = fs;
    for (const part of path) {
        if (
            currNode &&
            currNode.type === 'folder' &&
            typeof currNode.content === 'object' &&
            part in currNode.content
        ) {
            currNode = (currNode.content as FSNodeMap)[part];
        } else {
            return null;
        }
    }
    return currNode;
};

const isImagePath = (path: string) => {
    return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(path);
};

const FileExplorer: React.FC<FileExplorerProps> = ({
    initialPosition,
    onClose,
}) => {
    const [fileSystem, setFileSystem] = useState<FSNode | null>(null);
    const [currPath, setCurrPath] = useState<string[]>([]);
    const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
    const [iconJitters, setIconJitters] = useState<{
        [key: string]: { x: number; y: number };
    }>({});

    useEffect(() => {
        fetch('/content/fileSystem.json')
            .then((res) => res.json())
            .then((data) => setFileSystem(data))
            .catch((err) => console.error('Failed to load file system:', err));
    }, []);

    const currNode = getNestedNode(currPath, fileSystem);
    const items =
        currNode?.type === 'folder' ? (currNode.content as FSNodeMap) : null;

    useEffect(() => {
        const jitterInterval = setInterval(() => {
            if (!items) return;

            const newJitters: { [key: string]: { x: number; y: number } } = {};
            Object.keys(items).forEach((name) => {
                newJitters[name] = {
                    x: (Math.random() - 0.5) * 1.5,
                    y: (Math.random() - 0.5) * 1.5,
                };
            });
            setIconJitters(newJitters);
        }, 500);
        return () => clearInterval(jitterInterval);
    }, [items]);

    const handleItemDoubleClick = async (name: string, item: FSNode) => {
        switch (item.type) {
            case 'folder':
                setCurrPath([...currPath, name]);
                break;
            case 'file':
            case 'error':
                if (item.contentPath) {
                    if (isImagePath(item.contentPath)) {
                        openNewWindow(
                            name,
                            <ImageViewer
                                imageUrl={item.contentPath}
                                imageName={name}
                            />,
                            { width: 600, height: 500 },
                            false,
                        );
                    } else {
                        try {
                            const response = await fetch(item.contentPath);
                            const textContent = await response.text();

                            openNewWindow(
                                name,
                                <div style={{ margin: '10px' }}>
                                    <ReactMarkdown>{textContent}</ReactMarkdown>
                                </div>,
                            );
                        } catch (error) {
                            console.error(
                                'Failed to fetch file content:',
                                error,
                            );
                            openNewWindow(
                                name,
                                <p>ERROR: Could not load file.</p>,
                            );
                        }
                    }
                } else {
                    openNewWindow(
                        name,
                        <p style={{ whiteSpace: 'pre-wrap', margin: '10px' }}>
                            {item.content as string}
                        </p>,
                    );
                }
                break;
            case 'link':
                window.open(item.url, '_blank');
                break;
            case 'program':
                if (item.content === 'FileExplorer') {
                    openNewWindow(
                        name,
                        <p style={{ margin: '10px' }}>
                            ERROR: Recursive instance creation is not allowed.
                            System integrity is at risk.
                        </p>,
                    );
                }
                break;
            case 'music':
                openNewWindow(
                    name,
                    <MusicPlayer
                        title={name}
                        audioSrc={item.audioSrc}
                        coverArtUrl={item.coverArtUrl}
                    />,
                    { width: 300, height: 400 },
                    true,
                );
                break;
        }
    };

    const openNewWindow = (
        title: string,
        content: React.ReactNode,
        initialSize = { width: 350, height: 200 },
        degradation = true,
    ) => {
        const newWindow: OpenWindow = {
            id: Date.now(),
            title,
            content,
            position: {
                x: initialPosition.x + 30 + Math.random() * 100,
                y: initialPosition.y + 30 + Math.random() * 100,
            },
            size: initialSize,
            degradationEnabled: degradation,
        };
        setOpenWindows((prev) => [...prev, newWindow]);
    };

    const closeWindow = (id: number) => {
        setOpenWindows((prev) => prev.filter((w) => w.id !== id));
    };

    const handleBack = () => {
        setCurrPath((prev) => prev.slice(0, -1));
    };

    const pathString = `C:\\Windows\\${currPath.join('\\')}`;

    if (!fileSystem) {
        return (
            <DegradableWindow
                title="Loading..."
                initialPosition={initialPosition}
                initialSize={{ width: 500, height: 400 }}
            >
                <p style={{ padding: '10px' }}>Initializing file system...</p>
            </DegradableWindow>
        );
    }

    return (
        <>
            <DegradableWindow
                title={
                    <>
                        <img
                            src="icons/computer_explorer.ico"
                            height="16"
                            style={{ marginRight: '5px' }}
                        />
                        Exploring...{' '}
                    </>
                }
                initialPosition={initialPosition}
                initialSize={{ width: 500, height: 400 }}
                degradationEnabled={true}
                elasticResize={true}
                titleBarControls={
                    <>
                        <button aria-label="Minimize"></button>
                        <button aria-label="Maximize"></button>
                        <button aria-label="Close" onClick={onClose}></button>
                    </>
                }
            >
                <div className="file-explorer-toolbar">
                    <button
                        onClick={handleBack}
                        disabled={currPath.length === 0}
                    >
                        Back
                    </button>
                    <div className="address-bar sunken-panel">{pathString}</div>
                </div>
                <div
                    className="file-explorer-content sunken-panel"
                    style={{ height: '310px' }}
                >
                    {items ? (
                        Object.entries(items).map(([name, item]) => (
                            <div
                                key={name}
                                className="file-icon"
                                onDoubleClick={() =>
                                    handleItemDoubleClick(name, item)
                                }
                                style={{
                                    transform: `translate(${
                                        iconJitters[name]?.x || 0
                                    }px, ${iconJitters[name]?.y || 0}px)`,
                                }}
                            >
                                <img
                                    src={`icons/${item.icon}.ico`}
                                    alt={item.type}
                                    width="32"
                                    height="32"
                                />
                                <span>{name}</span>
                            </div>
                        ))
                    ) : (
                        <p>This folder is empty or corrupted</p>
                    )}
                </div>
            </DegradableWindow>

            {openWindows.map((win) => (
                <DegradableWindow
                    key={win.id}
                    title={win.title}
                    initialPosition={win.position}
                    initialSize={win.size}
                    degradationEnabled={win.degradationEnabled}
                    elasticResize={true}
                    titleBarControls={
                        <button
                            aria-label="Close"
                            onClick={() => closeWindow(win.id)}
                        ></button>
                    }
                >
                    {win.content}
                </DegradableWindow>
            ))}
        </>
    );
};

export default FileExplorer;
