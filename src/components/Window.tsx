import React from 'react';

interface WindowProps {
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    bodyStyle?: React.CSSProperties;
    statusBar?: React.ReactNode;
    titleBarControls?: React.ReactNode;
    titleBarProps?: React.HTMLAttributes<HTMLDivElement>;
}

const Window: React.FC<WindowProps> = ({
    title,
    children,
    className,
    style,
    bodyStyle,
    statusBar,
    titleBarControls,
    titleBarProps,
}) => {
    return (
        <div
            className={`window ${className || ''}`}
            style={{ display: 'flex', flexDirection: 'column', ...style }}
        >
            <div className="title-bar" {...titleBarProps}>
                <div className="title-bar-text">{title}</div>
                {titleBarControls && (
                    <div className="title-bar-controls">{titleBarControls}</div>
                )}
            </div>
            <div className="window-body" style={{ flexGrow: 1, ...bodyStyle }}>
                {children}
            </div>
            {statusBar && <div className="status-bar">{statusBar}</div>}
        </div>
    );
};

export default Window;
