import { useState, useEffect } from 'react';
import Window from './components/Window';
import EvasiveWindow from './components/EvasiveWindow';
import LivingWindow from './components/LivingWindow';
import DegradableWindow from './components/DegradableWindow';
import FileExplorer from './components/FileExplorer';
import './styles/living-window.css';
import './styles/degradable-window.css';
import './styles/file-explorer.css';

interface Project {
    name: string;
    type: string;
    lastUpdated: string;
    description: string;
    url: string | null;
}

const sortProjects = (projects: Project[]): Project[] => {
    const sorted = [...projects].sort((a, b) => {
        const aDateStr = a.lastUpdated;
        const bDateStr = b.lastUpdated;

        if (aDateStr === 'Ongoing' && bDateStr !== 'Ongoing') return -1;
        if (bDateStr === 'Ongoing' && aDateStr !== 'Ongoing') return 1;

        const isAUnknown = aDateStr.includes('?');
        const isBUnknown = bDateStr.includes('?');
        if (isAUnknown && !isBUnknown) return 1;
        if (isBUnknown && !isAUnknown) return -1;

        if (isAUnknown && isBUnknown) return 0;
        if (aDateStr === 'Ongoing' && bDateStr === 'Ongoing') return 0;

        try {
            const [aMonth, aDay, aYear] = aDateStr.split('/').map(Number);
            const [bMonth, bDay, bYear] = bDateStr.split('/').map(Number);

            const dateA = new Date(aYear, aMonth - 1, aDay);
            const dateB = new Date(bYear, bMonth - 1, bDay);

            return dateB.getTime() - dateA.getTime();
        } catch (error) {
            console.error(
                'Could not parse dates for sorting:',
                aDateStr,
                bDateStr,
                error,
            );
            return 0;
        }
    });

    return sorted;
};

const DesktopIcon: React.FC<{
    icon: string;
    label: string;
    onDoubleClick: () => void;
    style?: React.CSSProperties;
}> = ({ icon, label, onDoubleClick, style }) => (
    <div className="desktop-icon" onDoubleClick={onDoubleClick} style={style}>
        <img src={icon} alt={label} width="32" height="32" />
        <span>{label}</span>
    </div>
);

const buildDate = import.meta.env.BUILD_DATE || 'mm/dd/yy';

function App() {
    const [showMobileError, setShowMobileError] = useState(false);
    const [showAreYouSure, setShowAreYouSure] = useState(false);
    const [_isAboutTitleInactive, setIsAboutTitleInactive] = useState(false);
    const [showCowQuestion1, setShowCowQuestion1] = useState(false);
    const [showCowQuestion2, setShowCowQuestion2] = useState(false);
    const [showCowError, setShowCowError] = useState(false);
    const [_isCowTitleInactive, setIsCowTitleInactive] = useState(false);
    const [showProjectsError, setShowProjectsError] = useState(false);
    const [isProjectsBusy, setIsProjectsBusy] = useState(false);
    const [_isProjectsTitleInactive, setIsProjectsTitleInactive] =
        useState(false);
    const [showComplaint, setShowComplaint] = useState(false);
    const [showError1, setShowError1] = useState(false);
    const [showError2, setShowError2] = useState(false);
    const [isVolSliderDisabled, setIsVolSliderDisabled] = useState(false);
    const [_showRealWindow, _setShowRealWindow] = useState(false);
    const [showFileExplorer, setShowFileExplorer] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);

    const [movingWindowState, setMovingWindowState] = useState({
        visible: true,
        top: 300,
        left: 200,
    });

    const handleAboutCancel = () => {
        setShowAreYouSure(true);
        setIsAboutTitleInactive(true);
    };

    const handleCowClose = () => setShowCowQuestion1(true);
    const handleCowOk1 = () => setShowCowQuestion2(true);
    const handleCowCancel1 = () => setShowCowQuestion1(false);
    const handleCowOk2 = () => {
        setShowCowError(true);
        setIsCowTitleInactive(true);
    };
    const handleCowCancel2 = () => {
        setShowCowQuestion1(false);
        setShowCowQuestion2(false);
    };
    const handleProjectsClose = () => {
        setShowProjectsError(true);
        setIsProjectsBusy(true);
        setIsProjectsTitleInactive(true);
    };
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        const rand = Math.floor(Math.random() * 11);
        if (value % 2 === rand % 2) {
            setShowError1(true);
            setShowError2(true);
            setIsVolSliderDisabled(true);
        }
    };
    const handleOpenRealWindow = () => {
        const realWindow = document.getElementById('real-window');
        if (realWindow) {
            realWindow.style.display = 'block';
            realWindow.style.visibility = 'visible';
        }
    };
    const handleCloseRealWindow = () => {
        const realWindow = document.getElementById('real-window');
        if (realWindow) realWindow.style.display = 'none';
    };
    const handleNoToWindow = () => {
        setShowComplaint(true);
    };

    useEffect(() => {
        if (window.innerWidth <= 600) {
            setShowMobileError(true);
        }
    }, []);

    useEffect(() => {
        fetch('/content/projects.json')
            .then((res) => res.json())
            .then((data) => {
                const sortedData = sortProjects(data);
                setProjects(sortedData);
            })
            .catch((err) => console.error('Failed to load projects:', err));
    }, []);

    useEffect(() => {
        let timeoutId: number;
        const moveAndToggleWindow = () => {
            setMovingWindowState((prev) => ({ ...prev, visible: false }));
            timeoutId = window.setTimeout(() => {
                const winElement = document.getElementById('window-window');
                const width = winElement?.getBoundingClientRect().width || 250;
                const height =
                    winElement?.getBoundingClientRect().height || 100;
                const newX = Math.random() * (window.innerWidth - width);
                const newY = Math.random() * (window.innerHeight - height);

                setMovingWindowState({ visible: true, top: newY, left: newX });

                const randomDelay = Math.random() * 5000 + 3000;
                timeoutId = window.setTimeout(moveAndToggleWindow, randomDelay);
            }, Math.random() * 12000);
        };

        moveAndToggleWindow();

        return () => clearTimeout(timeoutId);
    }, []);

    if (showMobileError) {
        return (
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    zIndex: 999999,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: '#008080',
                }}
            >
                <Window
                    title="Error"
                    style={{
                        margin: '30vw',
                        width: '40vw',
                    }}
                    titleBarControls={
                        <button disabled aria-label="Close"></button>
                    }
                >
                    <div className="with-icon">
                        <span>
                            <img src="icons/msg_error.ico" alt="Error Icon" />
                        </span>
                        <p>This website only works on desktop.</p>
                        <section
                            className="field-row"
                            style={{ justifyContent: 'flex-end' }}
                        >
                            <button disabled>OK</button>
                        </section>
                    </div>
                </Window>
            </div>
        );
    }

    return (
        <>
            <DesktopIcon
                icon="icons/computer_explorer.ico"
                label="My Brain"
                onDoubleClick={() => setShowFileExplorer(true)}
                style={{
                    top: '250px',
                    left: '40px',
                }}
            />

            {showFileExplorer && (
                <FileExplorer
                    initialPosition={{ x: 150, y: 150 }}
                    onClose={() => setShowFileExplorer(false)}
                />
            )}
            <Window
                title="My First VB4 Program"
                style={{
                    position: 'absolute',
                    top: '23px',
                    left: '390px',
                    width: '250px',
                }}
            >
                <p>Hellow, world!</p>
            </Window>
            <DegradableWindow
                title="About"
                initialPosition={{ x: 32, y: 72 }}
                initialSize={{ width: 480, height: 150 }}
                degradationEnabled={true}
                elasticResize={true}
                titleBarControls={
                    <>
                        <button aria-label="Minimize"></button>
                        <button aria-label="Maximize"></button>
                        <button
                            aria-label="Close"
                            onClick={handleAboutCancel}
                        ></button>
                    </>
                }
            >
                <p>Teri is making (breaking) things...</p>
                <p>
                    Here, you can find some of their projects and things they
                    want to share with the www.
                </p>
                <br />
                <section
                    className="field-row"
                    style={{ justifyContent: 'flex-end' }}
                >
                    <button>OK</button>
                    <button onClick={handleAboutCancel}>Cancel</button>
                </section>
            </DegradableWindow>

            <LivingWindow
                title="Welcome to Teri's Computer"
                initialPosition={{ x: 350, y: 200 }}
                width={400}
                height={500}
                breathingIntensity={10}
            >
                <div style={{ padding: '20px' }}>
                    <h3>Welcome :)</h3>
                    <p style={{ marginTop: '15px', fontSize: '13px' }}>
                        This is a space where interfaces breathe, windows decay,
                        and the digital becomes sticky.
                    </p>

                    <div
                        style={{
                            marginTop: '20px',
                            padding: '10px',
                            background: 'rgba(255, 255, 200, 0.2)',
                            borderRadius: '3px',
                            fontSize: '12px',
                        }}
                    >
                        <strong>Explore:</strong>
                        <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
                            <li>Double-click "My Brain" to browse files</li>
                            <li>Drag or resize windows</li>
                            <li>Everything accumulates damage over time</li>
                            <li>
                                Some folders are more corrupted than others...
                            </li>
                        </ul>
                    </div>

                    <p style={{ marginTop: '15px', fontSize: '13px' }}>
                        The interface is not neutral; it has weight, friction,
                        and memories.
                    </p>

                    <p
                        style={{
                            marginTop: '80px',
                            fontSize: '11px',
                            fontStyle: 'italic',
                            color: 'red',
                        }}
                    >
                        "Long live the New Flesh!"
                    </p>
                </div>
            </LivingWindow>

            {showAreYouSure && (
                <Window
                    title="Question"
                    style={{
                        width: '400px',
                        position: 'absolute',
                        top: '150px',
                        left: '150px',
                    }}
                    titleBarControls={
                        <>
                            <button disabled aria-label="Minimize"></button>
                            <button disabled aria-label="Maximize"></button>
                            <button disabled aria-label="Close"></button>
                        </>
                    }
                >
                    <div className="with-icon">
                        <span>
                            <img
                                src="icons/msg_question.ico"
                                alt="Question Icon"
                            />
                        </span>
                        <p>Are you sure you want to destroy the window?</p>
                    </div>
                    <section
                        className="field-row"
                        style={{ justifyContent: 'flex-end' }}
                    >
                        <button disabled>OK</button>
                        <button disabled>Cancel</button>
                    </section>
                </Window>
            )}

            <LivingWindow
                title={
                    <>
                        <img
                            src="icons/sndyel.ico"
                            height="12"
                            style={{ marginRight: '5px' }}
                        />
                        Cow
                    </>
                }
                initialPosition={{ x: 160, y: 380 }}
                width={100}
                height={200}
                breathingIntensity={7}
                hungerEnabled={true}
                titleBarControls={
                    <button
                        aria-label="Close"
                        onClick={handleCowClose}
                    ></button>
                }
            >
                <div className="field-row">
                    <label htmlFor="cow">Moo</label>
                    <label htmlFor="cow">ooo</label>
                    <div className="is-vertical">
                        <input
                            id="cow"
                            className="has-box-indicator"
                            type="range"
                            min="0"
                            max="11"
                            step="1"
                            defaultValue="2"
                        />
                    </div>
                </div>
            </LivingWindow>

            {showCowQuestion1 && (
                <Window
                    title="Question"
                    style={{
                        width: '400px',
                        display: 'block',
                        position: 'absolute',
                        top: '370px',
                        left: '210px',
                    }}
                    titleBarControls={
                        <button disabled aria-label="Close"></button>
                    }
                >
                    <div className="with-icon">
                        <span>
                            <img
                                src="icons/msg_question.ico"
                                alt="Question Icon"
                            />
                        </span>
                        <p>
                            Are you sure you want to terminate the cow program?
                        </p>
                    </div>
                    <section
                        className="field-row"
                        style={{
                            justifyContent: 'flex-end',
                        }}
                    >
                        <button onClick={handleCowOk1}>OK</button>
                        <button onClick={handleCowCancel1}>Cancel</button>
                    </section>
                </Window>
            )}

            {showCowQuestion2 && (
                <Window
                    title="Question"
                    style={{
                        width: '400px',
                        display: 'block',
                        position: 'absolute',
                        top: '400px',
                        left: '240px',
                    }}
                    titleBarControls={
                        <button disabled aria-label="Close"></button>
                    }
                >
                    <div className="with-icon">
                        <span>
                            <img
                                src="icons/msg_question.ico"
                                alt="Question Icon"
                            />
                        </span>
                        <p>Do you really want to kill the cow?</p>
                    </div>
                    <section
                        className="field-row"
                        style={{ justifyContent: 'flex-end' }}
                    >
                        <button onClick={handleCowOk2}>OK</button>
                        <button onClick={handleCowCancel2}>Cancel</button>
                    </section>
                </Window>
            )}

            {showCowError && (
                <Window
                    title="Error"
                    style={{
                        width: '350px',
                        display: 'block',
                        position: 'absolute',
                        top: '440px',
                        left: '450px',
                        zIndex: 998,
                    }}
                    titleBarControls={
                        <button disabled aria-label="Close"></button>
                    }
                >
                    <div className="with-icon">
                        <span>
                            <img src="icons/msg_error.ico" alt="Error Icon" />
                        </span>
                        <p>Something went wrong. Press "Fix" to fix.</p>
                    </div>
                    <section
                        className="field-row"
                        style={{ justifyContent: 'flex-end' }}
                    >
                        <button disabled>Fix</button>
                    </section>
                </Window>
            )}

            <DegradableWindow
                title={
                    <>
                        {isProjectsBusy && (
                            <img
                                id="projects-busy"
                                src="icons/application_hourglass.ico"
                                height="12"
                                style={{ marginRight: '5px' }}
                            />
                        )}
                        Projects
                    </>
                }
                initialPosition={{ x: window.innerWidth - 500, y: 60 }}
                initialSize={{ width: 545, height: 310 }}
                degradationEnabled={true}
                elasticResize={true}
                titleBarControls={
                    <>
                        <button aria-label="Minimize"></button>
                        <button aria-label="Maximize"></button>
                        <button
                            id="projects-close"
                            aria-label="Close"
                            onClick={handleProjectsClose}
                        ></button>
                    </>
                }
            >
                <div
                    className="sunken-panel"
                    style={{ height: '264px', width: '520px' }}
                >
                    <table className="interactive">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Last Updated</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.length > 0 ? (
                                projects.map((project) => (
                                    <tr
                                        key={project.name}
                                        onClick={() =>
                                            project.url &&
                                            window.open(project.url, '_blank')
                                        }
                                        style={{
                                            cursor: project.url
                                                ? 'pointer'
                                                : 'default',
                                        }}
                                    >
                                        <td>{project.name}</td>
                                        <td>{project.type}</td>
                                        <td>{project.lastUpdated}</td>
                                        <td>{project.description}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>Loading projects...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DegradableWindow>

            {showProjectsError && (
                <Window
                    title="Error"
                    style={{
                        width: '350px',
                        position: 'absolute',
                        top: '195px',
                        left: '550px',
                        zIndex: 998,
                    }}
                    titleBarControls={
                        <button disabled aria-label="Close"></button>
                    }
                >
                    <div className="with-icon">
                        <span>
                            <img src="icons/msg_error.ico" alt="Error Icon" />
                        </span>
                        <p>An unknown error has occured.</p>
                    </div>
                    <section
                        className="field-row"
                        style={{ justifyContent: 'flex-end' }}
                    >
                        <button disabled>Help</button>
                    </section>
                </Window>
            )}

            {showError1 && (
                <Window
                    title=""
                    style={{
                        width: '350px',
                        position: 'absolute',
                        top: '295px',
                        left: '680px',
                        zIndex: 998,
                    }}
                >
                    <div className="with-icon">
                        <span>
                            <img src="icons/msg_error.ico" alt="Error Icon" />
                        </span>
                        <p></p>
                    </div>
                    <section
                        className="field-row"
                        style={{ justifyContent: 'flex-end' }}
                    >
                        <button disabled>
                            <br />
                        </button>
                    </section>
                </Window>
            )}

            {showError2 && (
                <Window
                    title="Error Error"
                    style={{
                        width: '350px',
                        position: 'absolute',
                        top: '355px',
                        left: '580px',
                        zIndex: 998,
                    }}
                    titleBarControls={
                        <button disabled aria-label="Close"></button>
                    }
                >
                    <div className="with-icon">
                        <span>
                            <img src="icons/msg_error.ico" alt="Error Icon" />
                        </span>
                        <p>
                            There was a critical error displaying the previous
                            error.
                        </p>
                    </div>
                    <section
                        className="field-row"
                        style={{ justifyContent: 'flex-end' }}
                    >
                        <button disabled>Help</button>
                    </section>
                </Window>
            )}

            {movingWindowState.visible && (
                <EvasiveWindow
                    title="Would you like to open a window?"
                    initialPosition={{
                        x: movingWindowState.left,
                        y: movingWindowState.top,
                    }}
                    initialSize={{ width: 250, height: 70 }}
                >
                    <section
                        className="field-row"
                        style={{ justifyContent: 'flex-start' }}
                    >
                        <button onClick={handleOpenRealWindow}>Yes</button>
                        <button onClick={handleNoToWindow}>No</button>
                    </section>
                </EvasiveWindow>
            )}

            {showComplaint && (
                <Window
                    title="?"
                    style={{
                        width: '350px',
                        position: 'absolute',
                        top: '245px',
                        left: '390px',
                        zIndex: 999,
                    }}
                    titleBarControls={
                        <button disabled aria-label="Close"></button>
                    }
                >
                    <div className="with-icon">
                        <span>
                            <img
                                src="icons/computer_search.ico"
                                alt="Search Icon"
                            />
                        </span>
                        <p>What would you like the computer to do?</p>
                    </div>
                    <section
                        className="field-row"
                        style={{ justifyContent: 'flex-end' }}
                    >
                        <div className="field-row">
                            <input
                                disabled
                                type="text"
                                defaultValue="Type here"
                            />
                        </div>
                        <button disabled>Enter</button>
                    </section>
                </Window>
            )}

            <div
                id="real-window"
                className="window"
                style={{
                    width: '98vw',
                    height: '97vh',
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    visibility: 'hidden',
                    zIndex: 1000,
                }}
            >
                <div className="title-bar">
                    <div className="title-bar-text">
                        A window with a window in it
                    </div>
                    <div className="title-bar-controls">
                        <button disabled aria-label="Minimize"></button>
                        <button disabled aria-label="Maximize"></button>
                        <button
                            aria-label="Close"
                            onClick={handleCloseRealWindow}
                        ></button>
                    </div>
                </div>
                <div className="window-body" style={{ overflowY: 'hidden' }}>
                    <div style={{ overflow: 'hidden' }}>
                        <iframe
                            id="ChiaHouse"
                            src="https://las-pinas.com/h.html?i=teri"
                            style={{
                                width: '100%',
                                height: '88vh',
                                border: 'medium',
                            }}
                            title="Chia House"
                        ></iframe>
                    </div>
                </div>
            </div>

            <div
                className="window"
                style={{
                    width: 'auto',
                    position: 'absolute',
                    left: '50px',
                    bottom: '30px',
                    zIndex: -1,
                }}
            >
                <div className="status-bar">
                    <p className="status-bar-field">Last Updated: {buildDate}</p>
                    <div
                        className="field-row status-bar-field"
                        style={{ width: '300px' }}
                    >
                        <label htmlFor="vol">
                            <img
                                src="icons/sndvol32_main.ico"
                                height="12"
                                style={{ marginLeft: '5px' }}
                            />
                        </label>
                        <label htmlFor="vol">Volume:</label>
                        <label htmlFor="vol">Low</label>
                        <input
                            id="vol"
                            type="range"
                            min="0"
                            max="10"
                            defaultValue="0"
                            onChange={handleVolumeChange}
                            disabled={isVolSliderDisabled}
                        />
                        <label htmlFor="vol">High</label>
                    </div>
                    <p className="status-bar-field">CPU Usage: ??%</p>
                </div>
            </div>
        </>
    );
}

export default App;
