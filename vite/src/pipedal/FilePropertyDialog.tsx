// Copyright (c) 2023 Robin Davies
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


import React from 'react';
import { createStyles } from './WithStyles';

// import Tone3000Dialog from './Tone3000Dialog';
import Tone3000HelpDialog from './Tone3000HelpDialog';
import GuitarMLHelpDialog from './GuitarMlHelpDialog';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LinkEx from './LinkEx';
import DraggableButtonBase from './DraggableButtonBase';
import CloseIcon from '@mui/icons-material/Close';
import { Theme } from '@mui/material/styles';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import RenameDialog from './RenameDialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import MoreIcon from '@mui/icons-material/MoreVert';
import { PiPedalModel, PiPedalModelFactory, FileEntry, BreadcrumbEntry, FileRequestResult } from './PiPedalModel';
import { isDarkMode } from './DarkMode';
import Button from '@mui/material/Button';
import ButtonEx from './ButtonEx';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButtonEx from './IconButtonEx';
import OldDeleteIcon from './OldDeleteIcon';
import Toolbar from '@mui/material/Toolbar';
import WithStyles from './WithStyles';
import { withStyles } from "tss-react/mui";
import CircularProgress from '@mui/material/CircularProgress';
import { pathConcat, pathParentDirectory, pathFileName, pathFileNameOnly, pathExtension } from './FileUtils'; './FileUtils';


import ResizeResponsiveComponent from './ResizeResponsiveComponent';
import { UiFileProperty } from './Lv2Plugin';
import Typography from '@mui/material/Typography';
import DialogEx from './DialogEx';
import UploadFileDialog from './UploadFileDialog';
import OkCancelDialog from './OkCancelDialog';
import HomeIcon from '@mui/icons-material/Home';
import FilePropertyDirectorySelectDialog from './FilePropertyDirectorySelectDialog';
import { getAlbumArtUri, getTrackTitle } from './AudioFileMetadata';


const ToobNamModelFileUrl = "http://two-play.com/plugins/toob-nam#modelFile";
const ToobMlModelFileUrl = "http://two-play.com/plugins/toob-ml#modelFile";

const AUTOSCROLL_TICK_DELAY = 30;
const AUTOSCROLL_THRESHOLD = 48;
const AUTOSCROLL_SCROLL_PER_SECOND = 500;
const AUTOSCROLL_SCROLL_RATE = AUTOSCROLL_SCROLL_PER_SECOND * AUTOSCROLL_TICK_DELAY / 1000;


interface Point {
    x: number;
    y: number;
}


const styles = (theme: Theme) => createStyles({
    secondaryText: {
        color: theme.palette.text.secondary
    },
});

const audioFileExtensions: { [name: string]: boolean } = {
    ".wav": true,
    ".flac": true,
    ".mp3": true,
    ".m4a": true,
    ".ogg": true,
    ".aac": true,
    ".au": true,
    ".snd": true,
    ".mid": true,
    ".rmi": true,
    ".mp4": true,
    ".aif": true,
    ".aifc": true,
    ".aiff": true,
    ".ra": true
};

function screenToClient(currentTarget: HTMLElement, e: React.PointerEvent | React.MouseEvent): Point {
    let rect = currentTarget.getBoundingClientRect();
    const x = e.clientX + rect.left;
    const y = e.clientY + rect.right;
    return { x: x, y: y };
}
function isAudioFile(filename: string) {
    let npos = filename.lastIndexOf('.');
    let nposSlash = filename.lastIndexOf('/');
    if (nposSlash >= npos) {
        return false;
    }
    let extension = filename.substring(npos);
    return audioFileExtensions[extension] !== undefined;
}

export interface FilePropertyDialogProps extends WithStyles<typeof styles> {
    open: boolean,
    fileProperty: UiFileProperty,
    instanceId: number,
    selectedFile: string,
    onOk: (fileProperty: UiFileProperty, selectedItem: string) => void,
    onApply: (fileProperty: UiFileProperty, selectedItem: string) => void,
    onCancel: () => void
};
export interface FilePropertyDialogState {
    reordering: boolean;
    loading: boolean;
    dragState: DragState | null;
    showProgress: boolean;
    fullScreen: boolean;
    selectedFile: string;
    selectedFileIsDirectory: boolean;
    selectedFileProtected: boolean;
    hasSelection: boolean;
    hasFileSelection: boolean;
    canDelete: boolean;
    fileResult: FileRequestResult;
    navDirectory: string;
    windowWidth: number;
    windowHeight: number;
    currentDirectory: string;
    isProtectedDirectory: boolean;
    columns: number;
    columnWidth: number;
    openUploadFileDialog: boolean;
    openConfirmDeleteDialog: boolean;
    confirmCopyDialogState: {
        fileName: string;
        oldFilePath: string;
        newFilePath: string;
    } | null;
    menuAnchorEl: null | HTMLElement;
    menuMultiselectAnchorEl: null | HTMLElement;
    newFolderDialogOpen: boolean;
    renameDialogOpen: boolean;
    moveDialogOpen: boolean;
    copyDialogOpen: boolean;
    initialSelection: string;
    multiSelect: boolean,
    selectedFiles: string[],
    //openTone3000Dialog: boolean,
    openTone3000Help: boolean,
    openGuitarMlHelp: boolean

};

interface DragState {
    activeItem: string;
    height: number;
    dragElement: HTMLElement;
    dragElementDy: number;
    from: number;
    to: number;
    lastMousePoint: Point;
};

export default withStyles(
    class FilePropertyDialog extends ResizeResponsiveComponent<FilePropertyDialogProps, FilePropertyDialogState> {

        getNavDirectoryFromFile(selectedFile: string, fileProperty: UiFileProperty): string {
            if (selectedFile === "") {
                return "";
            }
            return pathParentDirectory(selectedFile);
        }

        isTracksDirectory(): boolean {
            return this.state.currentDirectory.startsWith("/var/pipedal/audio_uploads/shared/audio/Tracks");
        }
        isFolderArtwork(filePath: string): boolean {
            if (!this.isTracksDirectory()) return false;
            let extension = pathExtension(filePath);
            return extension === ".png" || extension === ".jpg" || extension === ".jpeg";
        }

        constructor(props: FilePropertyDialogProps) {
            super(props);


            this.model = PiPedalModelFactory.getInstance();

            let selectedFile = props.selectedFile;
            this.state = {
                reordering: false,
                loading: false,
                dragState: null,
                showProgress: false,
                fullScreen: this.getFullScreen(),
                selectedFile: selectedFile,
                selectedFileProtected: true,
                windowWidth: this.windowSize.width,
                windowHeight: this.windowSize.height,
                selectedFileIsDirectory: false,
                navDirectory: this.getNavDirectoryFromFile(selectedFile, props.fileProperty),
                currentDirectory: "",
                hasSelection: false,
                hasFileSelection: false,
                canDelete: false,
                columns: 0,
                columnWidth: 1,
                fileResult: new FileRequestResult(),
                isProtectedDirectory: true,
                openUploadFileDialog: false,
                openConfirmDeleteDialog: false,
                confirmCopyDialogState: null,
                menuAnchorEl: null,
                menuMultiselectAnchorEl: null,
                newFolderDialogOpen: false,
                renameDialogOpen: false,
                moveDialogOpen: false,
                copyDialogOpen: false,
                initialSelection: this.props.selectedFile,
                multiSelect: false,
                selectedFiles: [],
                //openTone3000Dialog: false,
                openTone3000Help: false,
                openGuitarMlHelp: false
            };
            this.requestScroll = true;
        }
        getFullScreen() {
            return document.documentElement.clientWidth < 450 || document.documentElement.clientHeight < 450;
        }

        hProgressTimeout: number | null = null;

        private scrollRef: HTMLDivElement | null = null;

        cancelProgressTimeout() {
            if (this.hProgressTimeout !== null) {
                window.clearTimeout(this.hProgressTimeout);
                this.hProgressTimeout = null;
            }

        }
        onScrollRef(element: HTMLDivElement | null) {
            this.scrollRef = element;
            this.maybeScrollIntoView();
        }
        private maybeScrollIntoView() {
            if (this.scrollRef !== null && this.state.fileResult.files.length !== 0 && this.mounted && this.requestScroll) {
                this.requestScroll = false;
                let options: ScrollIntoViewOptions = { block: "nearest" };
                options.block = "nearest";

                this.scrollRef.scrollIntoView(options);
            }
        }
        private mounted: boolean = false;
        private model: PiPedalModel;

        transformDragPoint(element: HTMLElement, point: Point): Point {
            // STUB: will have to deal with scroll offset at some point.
            return point;
        }

        private requestFiles(navPath: string) {
            if (!this.props.open) {
                return;
            }
            if (this.props.fileProperty.directory === "") {
                return;
            }
            this.setState({
                loading: true,
                showProgress: false,
                fileResult: new FileRequestResult(),
                hasFileSelection: false,
                hasSelection: false,
            });
            this.hProgressTimeout = window.setTimeout(() => {
                if (this.mounted) {
                    this.setState({ showProgress: true });
                }
            }, 1000);
            this.model.requestFileList2(navPath, this.props.fileProperty)
                .then((filesResult) => {
                    if (this.mounted) {
                        this.cancelProgressTimeout();
                        filesResult.files.splice(0, 0, { pathname: "", displayName: "<none>", isDirectory: false, isProtected: true });

                        let fileEntry = this.getFileEntry(filesResult.files, this.state.selectedFile);
                        this.setState({
                            loading: false,
                            showProgress: false,
                            isProtectedDirectory: filesResult.isProtected,
                            fileResult: filesResult,
                            hasSelection: !!fileEntry,
                            hasFileSelection: !!fileEntry && (!fileEntry.isDirectory) && (!fileEntry.isProtected),
                            selectedFileProtected: fileEntry ? fileEntry.isProtected : true,
                            navDirectory: navPath,
                            currentDirectory: filesResult.currentDirectory
                        });
                    }
                }).catch((error) => {
                    this.cancelProgressTimeout();
                    if (!this.mounted) return;
                    if (navPath !== "") // deleted sample directory maybe?
                    {
                        this.navigate("");
                    } else {
                        this.setState({
                            loading: false,
                            showProgress: false,
                            fileResult: new FileRequestResult(),
                            isProtectedDirectory: false,
                            navDirectory: "",
                            currentDirectory: ""
                        });
                        this.model.showAlert(error.toString())
                    }
                });
        }

        private lastDivRef: HTMLDivElement | null = null;

        longPressStartPoint: Point | null = null;

        maxPosition: number = 0;

        handleMultisSelectClose() {
            this.setState({
                multiSelect: false, selectedFiles: [], menuMultiselectAnchorEl: null
            });
        }


        handleLongPressStart(
            currentTarget: HTMLButtonElement,
            e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>,
            fileEntry: FileEntry): boolean {
            if (this.state.reordering) {

                if (!this.isTracksDirectory()) {
                    return false;
                }
                let element = currentTarget;
                let index = parseInt(element.getAttribute("data-position") as string, 10);
                if (this.listContainerElementRef) {
                    this.longPressStartPoint = screenToClient(currentTarget, e);
                    let dragState: DragState = {
                        activeItem: fileEntry.pathname,
                        dragElement: element,
                        height: element.clientHeight,
                        dragElementDy: 0,
                        from: index,
                        to: index,
                        lastMousePoint: { ...this.longPressStartPoint }
                    };
                    this.setState({ dragState: dragState });
                }

                return true;
            } else if (!this.state.multiSelect) {
                if (fileEntry.isProtected) {
                    return false;
                }
                this.setState(
                    {
                        multiSelect: true,
                        selectedFiles: [fileEntry.pathname],
                    }
                );
                return true;
            }
            return false;

        }
        dragTarget: HTMLButtonElement | null = null;


        updateReorderPosition(element: HTMLButtonElement, point: Point) {
            if (this.longPressStartPoint) {
                let dragDy = point.y - this.longPressStartPoint.y;
                let height = element.clientHeight;

                let dragFromPosition = parseInt(element.getAttribute("data-position") as string, 10);

                let elementOffset = dragFromPosition * height;
                let newOffset = elementOffset + dragDy;
                if (newOffset < 0) {
                    dragDy = -elementOffset;
                    newOffset = 0;
                }
                let maxOffset = (this.maxPosition - 1) * height;
                if (newOffset > maxOffset) {
                    dragDy = maxOffset - elementOffset;
                    newOffset = maxOffset;
                }
                let toPosition = Math.floor((newOffset + height / 2) / height);
                if (toPosition < 0) {
                    toPosition = 0;
                }
                if (toPosition > this.maxPosition) {
                    toPosition = this.maxPosition;
                }
                // console.log("drag from " + dragFromPosition + " to " + toPosition + " dy: " + dragDy);
                this.setState({
                    dragState: {
                        activeItem: element.getAttribute("data-pathname") || "",
                        dragElement: element,
                        height: height,
                        dragElementDy: dragDy,
                        from: dragFromPosition,
                        to: toPosition,
                        lastMousePoint: point
                    }
                });
            }
        }
        handleLongPressMove(e: React.PointerEvent<HTMLButtonElement>) {
            if (this.state.reordering) {
                if (!this.isTracksDirectory()) {
                    return;
                }
                if (this.listContainerElementRef) {
                    let element = e.target as HTMLButtonElement;
                    let point = screenToClient(e.currentTarget, e);
                    this.updateReorderPosition(element, point);
                    this.startAutoScroll()

                }
            }
        }
        handleReorderFiles(from: number, to: number) {

            // Update the local state with the new order so that we don't 
            // flash the old order while waiting for a server update.
            let oldFileResult = this.state.fileResult;
            let newFileResult = new FileRequestResult();
            newFileResult.files = oldFileResult.files.slice();
            newFileResult.isProtected = oldFileResult.isProtected;
            newFileResult.currentDirectory = oldFileResult.currentDirectory;
            newFileResult.breadcrumbs = oldFileResult.breadcrumbs.slice();

            let ixFrom = -1;
            let ixTo = -1;
            let ix = 0;
            for (let i = 0; i < newFileResult.files.length; ++i) {
                let fileEntry = newFileResult.files[i];
                if (fileEntry.metadata) {
                    if (ix === from) {
                        ixFrom = i;
                    }
                    if (ix === to) {
                        ixTo = i;
                    }
                    ++ix;
                }
            }
            if (ixTo === -1 || ixFrom === -1) {
                return;
            }
            if (ixTo == ixFrom) return;
            if (ixTo < ixFrom) {
                // move up.
                newFileResult.files.splice(ixTo, 0, newFileResult.files[ixFrom]);
                newFileResult.files.splice(ixFrom + 1, 1);
            } else {
                // move down.
                newFileResult.files.splice(ixTo + 1, 0, newFileResult.files[ixFrom]);
                newFileResult.files.splice(ixFrom, 1);
            }

            this.setState({ fileResult: newFileResult, dragState: null });

            // Now send the reorder request to the server.
            this.model.moveAudioFile(
                this.state.currentDirectory, from, to);
        }
        handleLongPressEnd(e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>, fileEntry: FileEntry) {
            if (this.state.reordering) {
                if (!this.isTracksDirectory()) {
                    return;
                }
                let dragState = this.state.dragState;
                if (dragState && dragState.to != dragState.from) {
                    this.handleReorderFiles(dragState.from, dragState.to);

                }
                // prevent onClick from firing.
                e.preventDefault();
                e.stopPropagation();

                this.setState({ dragState: null });
                this.stopAutoScroll();
            } else if (!this.state.multiSelect) {
                let selectedFile = fileEntry.pathname;
                if (selectedFile === "") {
                    return;
                }
                this.setState({
                    multiSelect: true,
                    selectedFiles: [selectedFile],
                });
                e.stopPropagation();
                e.preventDefault();
            }
        }
        onMeasureRef(div: HTMLDivElement | null) {
            this.lastDivRef = div;
            if (div) {
                let width = div.offsetWidth;
                if (width === 0) return;
                let columns = 1;
                let columnWidth = (width - 40) / columns;
                if (columns !== this.state.columns || columnWidth !== this.state.columnWidth) {
                    this.setState({ columns: columns, columnWidth: columnWidth });
                }
            }
        }
        onWindowSizeChanged(width: number, height: number): void {

            this.setState({
                fullScreen: this.getFullScreen(),
                windowWidth: width,
                windowHeight: height
            })
            if (this.lastDivRef !== null) {
                this.onMeasureRef(this.lastDivRef);
            }

        }

        private requestScroll: boolean = false;

        componentDidMount() {
            super.componentDidMount();
            this.mounted = true;
            this.requestFiles(this.state.navDirectory)
            this.requestScroll = true;
        }
        componentWillUnmount() {
            this.stopAutoScroll();
            this.cancelProgressTimeout();

            super.componentWillUnmount();
            this.mounted = false;
            this.lastDivRef = null;
        }
        componentDidUpdate(prevProps: Readonly<FilePropertyDialogProps>, prevState: Readonly<FilePropertyDialogState>, snapshot?: any): void {
            super.componentDidUpdate?.(prevProps, prevState, snapshot);
            if (prevProps.open !== this.props.open
            ) {
                if (this.props.open) {
                    let selectedFile = this.props.selectedFile;
                    let navDirectory = this.getNavDirectoryFromFile(selectedFile, this.props.fileProperty);
                    this.setState({
                        selectedFile: selectedFile,
                        selectedFileIsDirectory: false,
                        selectedFileProtected: true,
                        newFolderDialogOpen: false,
                        renameDialogOpen: false,
                        moveDialogOpen: false,
                        copyDialogOpen: false,
                        navDirectory: navDirectory
                    });
                    this.requestFiles(navDirectory)
                    this.requestScroll = true;
                }
            }

        }

        private isDirectory(path: string): boolean {
            for (var fileEntry of this.state.fileResult.files) {
                if (fileEntry.pathname === path) {
                    return fileEntry.isDirectory;
                }
            }
            return false;
        }
        private isFileInList(files: FileEntry[], file: string) {

            let hasSelection = false;
            if (file === "") return true;
            for (var listFile of files) {
                if (listFile.pathname === file) {
                    hasSelection = true;
                    break;
                }
            }
            return hasSelection;
        }
        private getFileEntry(files: FileEntry[], file: string): FileEntry | undefined {

            if (file === "") return undefined;
            for (var listFile of files) {
                if (listFile.pathname === file) {
                    return listFile;
                }
            }
            return undefined;
        }


        handleFileClick(event: React.MouseEvent<HTMLElement>, fileEntry: FileEntry) {
            if (this.state.reordering) {
                return;
            }
            if (event.ctrlKey || this.state.multiSelect) {
                if (fileEntry.isProtected) {
                    // <none> cannot be multiselected.
                    return;
                }
                if (this.state.multiSelect) {
                    let selectedFiles = this.state.selectedFiles.slice();
                    let ix = selectedFiles.indexOf(fileEntry.pathname);
                    if (ix === -1) {
                        selectedFiles.push(fileEntry.pathname);
                    } else {
                        selectedFiles.splice(ix, 1);
                    }
                    if (selectedFiles.length === 0) {
                        this.setState({
                            multiSelect: false,
                            selectedFiles: []
                        });
                    } else {
                        this.setState({
                            multiSelect: true,
                            selectedFiles: selectedFiles
                        });
                    }
                } else {
                    let selectedFiles = [fileEntry.pathname];
                    if (this.state.hasSelection) {
                        if (this.state.selectedFile !== "") {
                            selectedFiles.push(this.state.selectedFile);
                        }
                    }
                    this.setState({
                        multiSelect: true,
                        selectedFiles: selectedFiles
                    });
                }
                event.stopPropagation();
                event.preventDefault();
                return;
            }
            if (event.shiftKey) {
                event.stopPropagation();
                event.preventDefault();
                return;

            }
            this.requestScroll = true;
            if (!fileEntry.isDirectory) {
                if (!this.isFolderArtwork(fileEntry.pathname)) {
                    this.props.onApply(this.props.fileProperty, fileEntry.pathname);
                }
            }
            this.setState({
                selectedFile: fileEntry.pathname,
                selectedFileIsDirectory: fileEntry.isDirectory,
                selectedFileProtected: fileEntry.isProtected,
                hasSelection: this.isFileInList(this.state.fileResult.files, fileEntry.pathname),
                hasFileSelection: !fileEntry.isDirectory && !fileEntry.isDirectory && !fileEntry.isProtected
            })
        }
        onDoubleClickValue(selectedFile: string) {
            if (this.state.reordering) {
                return;
            }
            this.openSelectedFile();
        }

        handleMenuOpen(event: React.MouseEvent<HTMLElement>) {
            this.setState({ menuAnchorEl: event.currentTarget });

        }
        handleMenuClose() {
            this.setState({ menuAnchorEl: null });
        }
        handleMenuMultiSelectOpen(event: React.MouseEvent<HTMLElement>) {
            this.setState({ menuMultiselectAnchorEl: event.currentTarget });

        }
        handleMenuMultiSelectClose() {
            this.setState({ menuMultiselectAnchorEl: null });
        }
        canDeleteEntry(fileEntry: FileEntry): boolean {
            return fileEntry.isProtected;
        }
        handleDelete() {
            if (this.state.selectedFileProtected && !this.state.multiSelect) {
                return;
            }
            this.setState({ openConfirmDeleteDialog: true });
        }
        handleDownloadFile() {
            if (this.state.selectedFileProtected || !this.state.hasFileSelection) {
                return;
            }
            let file = this.state.selectedFile;
            this.model.downloadAudioFile(file);
        }
        async handleConfirmDelete() {
            this.setState({ openConfirmDeleteDialog: false });
            let files: string[] = [];
            if (this.state.multiSelect) {
                files = this.state.selectedFiles;
            } else {
                if (this.state.selectedFileProtected) {
                    return;
                }
                files = [this.state.selectedFile];
            }
            let selectedFile = (!this.state.multiSelect && this.state.hasSelection) ? this.state.selectedFile : undefined;
            let newSelectedFiles = this.state.selectedFiles.slice();
            let multiSelect = this.state.multiSelect;
            let resultFiles = this.state.fileResult.files;

            try {
                for (let file of files) {
                    if (!multiSelect) {
                        if (selectedFile) {
                            let position = -1;
                            for (let i = 0; i < resultFiles.length; ++i) {
                                let file = resultFiles[i];
                                if (file.pathname === selectedFile) {
                                    position = i;
                                    break;
                                }
                            }
                            if (position >= 0 && position < resultFiles.length - 1) {
                                selectedFile = this.state.fileResult.files[position + 1].pathname;
                            } else if (position === this.state.fileResult.files.length - 1) {
                                if (position !== 0) {
                                    selectedFile = this.state.fileResult.files[position - 1].pathname;
                                } else {
                                    selectedFile = undefined;
                                }
                            } else {
                                selectedFile = undefined;
                            }
                        }
                    } else {
                        let ix = newSelectedFiles.indexOf(file);
                        if (ix >= 0) {
                            newSelectedFiles.splice(ix, 1);
                        }
                    }
                    await this.model.deleteUserFile(file);
                }
            } catch (e: any) {
                this.model.showAlert(e);
            }

            // update state for what we've done.
            if (!this.mounted) {
                return;
            }
            if (multiSelect) {
                if (newSelectedFiles.length === 0) {
                    this.setState({
                        multiSelect: false,
                        selectedFiles: [],
                    });
                } else {
                    this.setState({
                        multiSelect: true,
                        selectedFiles: newSelectedFiles,
                    });
                }
            } else {
                if (selectedFile) {
                    this.setState({
                        selectedFile: selectedFile
                    });
                }
            }
            this.requestFiles(this.state.navDirectory);
        }

        navigate(relativeDirectory: string) {
            this.requestFiles(relativeDirectory);
            this.setState({ navDirectory: relativeDirectory });
        }
        handleBreadcrumbNavigate(relativeDirectory: string) {
            if (!this.state.reordering && !this.state.multiSelect) {
                this.navigate(relativeDirectory);
            }
        }
        getCompactTrackTitle(fileEntry: FileEntry): string {
            let metadata = fileEntry.metadata;
            let title = getTrackTitle(fileEntry.pathname, metadata);
            if (!metadata) {
                return title;
            }

            if (metadata.album !== "") {
                title += " (" + metadata.album + ")";
            }
            return title;
        }


        getAlbumTitle(fileEntry: FileEntry): string {
            let artist = fileEntry.metadata?.artist || "";
            if (artist == "") {
                artist = fileEntry.metadata?.albumArtist || "";
            }
            let album = fileEntry.metadata?.album || "";
            let joiner = (artist !== "" && album !== "") ? " - " : "";
            return album + joiner + artist;
        }
        getTrackThumbnail(fileEntry: FileEntry): string {
            return getAlbumArtUri(this.model, fileEntry.metadata, fileEntry.pathname);
        }
        renderBreadcrumbs() {
            let breadcrumbs: React.ReactElement[] = [(
                <Button variant="text"
                    color="inherit"
                    key="h" onClick={() => { this.handleBreadcrumbNavigate(""); }}
                    style={{ textTransform: "none", flexShrink: 0 }}
                    startIcon={(<HomeIcon sx={{ mr: 0.6 }} fontSize="inherit" />)}
                >
                    <Typography style={{}} variant="body2" noWrap>Home</Typography>
                </Button>
            )
            ];

            for (let i = 1; i < this.state.fileResult.breadcrumbs.length - 1; ++i) {
                let breadcrumb: BreadcrumbEntry = this.state.fileResult.breadcrumbs[i];

                breadcrumbs.push((
                    <Typography key={"x" + (i)} variant="body2" style={{ marginTop: 6, marginBottom: 6 }} noWrap>/</Typography>

                )
                );
                breadcrumbs.push((
                    <Button variant="text"
                        key={"bc" + i}
                        color="inherit"
                        onClick={() => { this.handleBreadcrumbNavigate(breadcrumb.pathname) }}
                        style={{ minWidth: 0, textTransform: "none", flexShrink: 0 }}
                    >
                        <Typography variant="body2" style={{}} noWrap>{breadcrumb.displayName}</Typography>


                    </Button>
                ));
            }
            if (this.state.fileResult.breadcrumbs.length > 1) {
                let lastdirectory = this.state.fileResult.breadcrumbs[this.state.fileResult.breadcrumbs.length - 1];
                breadcrumbs.push((
                    <Typography key={"xLast"} variant="body2" style={{ userSelect: "none", marginTop: 6, marginBottom: 6 }} noWrap>/</Typography>

                )
                );
                breadcrumbs.push((
                    <div key={"bc-last"} style={{ flexShrink: 0, paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6, overflowX: "clip" }}>
                        <Typography noWrap
                            style={{}} variant="body2"
                            color="text.secondary"> {lastdirectory.displayName}</Typography>
                    </div>
                ));

            }
            return (
                <div>

                    <div aria-label="breadcrumb"
                        style={{ marginLeft: 16, marginBottom: 8, marginRight: 8, textOverflow: "", display: "flex", flexFlow: "row wrap", alignItems: "center", justifyContent: "start" }}>
                        {breadcrumbs}
                    </div>
                </div>
            );
        }

        getDefaultPath(): string {
            try {
                let storage = window.localStorage;
                let result = storage.getItem("fpDefaultPath");
                if (result) {
                    return result;
                }
            } catch (e) {

            }

            return this.state.navDirectory;
        }
        setDefaultPath(path: string) {
            try {
                let storage = window.localStorage;
                storage.setItem("fpDefaultPath", path);
            } catch (e) {

            }
        }
        hasSelectedFileOrFolder(): boolean {
            return this.state.hasSelection && this.state.selectedFile !== "";
        }
        getFileExtensionList(uiFileProperty: UiFileProperty): string {
            let result = "";
            for (var fileType of uiFileProperty.fileTypes) {
                if (fileType.fileExtension !== "" && fileType.fileExtension !== ".zip") {
                    if (result !== "") result = result + ",";
                    result += fileType.fileExtension;
                }
            }
            return result;
        }


        private getIcon(fileEntry: FileEntry, largeIcon: boolean) {
            let style = largeIcon
                ? {
                    flex: "0 0 auto", opacity: 0.7, width: 32, height: 32,
                    marginLeft: 16, marginRight: 24, marginTop: 16, marginBottom: 16,
                }
                : { flex: "0 0 auto", opacity: 0.7, marginRight: 8, marginLeft: 8 };




            if (fileEntry.pathname === "") {
                return (<InsertDriveFileOutlinedIcon style={style} />);
            }
            if (fileEntry.isDirectory) {
                return (
                    <FolderIcon style={style} />
                );
            }
            if (isAudioFile(fileEntry.pathname)) {
                return (<AudioFileIcon style={style} />);
            }
            return (<InsertDriveFileIcon style={style} />);
        }

        private listContainerElementRef: HTMLDivElement | null = null;
        private scrollContainerElementRef: HTMLDivElement | null = null;
        private autoScrollTimer: number | null = null;

        handleAutoScrollTick() {
            let dragState = this.state.dragState;
            if (!dragState) return;

            let scrollContainer = this.scrollContainerElementRef;
            if (!scrollContainer) {
                return;
            }
            let scrollBounds_ = scrollContainer.getBoundingClientRect();
            let scrollClientTop = scrollBounds_.top;
            let scrollClientBottom = scrollClientTop + scrollContainer.clientHeight;
            let dragBounds = dragState.dragElement?.getBoundingClientRect();

            let dy = 0;
            let y = scrollContainer.scrollTop;
            if (dragBounds.top < scrollClientTop + AUTOSCROLL_THRESHOLD) {
                dy = -AUTOSCROLL_SCROLL_RATE;

                y = scrollContainer.scrollTop + dy;
                if (y < 0) y = 0;
                dy = y - scrollContainer.scrollTop;
            } else if (dragBounds.bottom > scrollClientBottom - AUTOSCROLL_THRESHOLD) {
                dy = AUTOSCROLL_SCROLL_RATE;

                y = scrollContainer.scrollTop + dy;
                let maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                if (y > maxScrollTop) {
                    y = maxScrollTop;
                }
                dy = y - scrollContainer.scrollTop;
            } else {
                return;
            }
            if (this.longPressStartPoint === null) {
                return;
            }
            if (dy === 0) {
                return;
            }
            this.longPressStartPoint = {
                x: this.longPressStartPoint.x,
                y: this.longPressStartPoint.y - dy
            };
            let dragElementDy = dragState.lastMousePoint.y - this.longPressStartPoint.y;
            let originalY = dragState.from * dragState.height;
            let newY = originalY + dragElementDy;
            if (newY < 0) {
                newY = 0;
                dragElementDy = -originalY;
            }
            let maxDy = (this.maxPosition - 1) * dragState.height;
            if (newY > maxDy) {
                newY = maxDy;
                dragElementDy = maxDy - originalY;
            }
            let newTo = Math.floor((newY + dragState.height / 2) / dragState.height);


            let newDragState = { ...dragState };

            newDragState.dragElementDy = dragElementDy;
            newDragState.to = newTo;

            // console.log("autoscroll from " + dragState.from + " to " + newTo + " dy: " + dragElementDy);
            // avoid jitter.
            newDragState.dragElement.style.top = (newDragState.dragElementDy + 5) + "px";

            this.setState({ dragState: newDragState });
            scrollContainer.scrollTo({ left: 0, top: y, behavior: "instant" });
            this.startAutoScroll();

        }


        stopAutoScroll() {
            if (this.autoScrollTimer !== null) {
                clearTimeout(this.autoScrollTimer);
                this.autoScrollTimer = null;
            }
        }
        startAutoScroll() {
            this.stopAutoScroll();

            this.autoScrollTimer = setTimeout(
                () => { this.handleAutoScrollTick() }, AUTOSCROLL_TICK_DELAY);
        }

        // handleTone3000Dialog(e: React.MouseEvent<HTMLButtonElement>) {
        //     e.stopPropagation();
        //     e.preventDefault();

        //     this.setState({ openTone3000Dialog: true });

        // }


        handleGuitarMlHelp(e: React.MouseEvent<HTMLButtonElement>) {
            e.stopPropagation();
            e.preventDefault();

            this.setState({ openGuitarMlHelp: true });

        }


        handleTone3000Help(e: React.MouseEvent<HTMLButtonElement>) {
            e.stopPropagation();
            e.preventDefault();

            this.setState({ openTone3000Help: true });

        }

        render() {
            const isTracksDirectory = this.isTracksDirectory();
            const isToobNamModelFile = this.props.fileProperty.patchProperty === ToobNamModelFileUrl;
            const isToobMLModelFile = this.props.fileProperty.patchProperty === ToobMlModelFileUrl;

            const classes = withStyles.getClasses(this.props);
            let columnWidth = this.state.columnWidth;
            let okButtonText = "Select";
            if (this.state.hasSelection && this.state.selectedFileIsDirectory) {
                okButtonText = "Open";
            }
            let protectedDirectory = this.state.fileResult.isProtected;
            let protectedItem = true;
            if (this.state.hasSelection) {
                protectedItem = this.state.selectedFileProtected;
            }
            let canMove = this.hasSelectedFileOrFolder() && !protectedItem;
            let canRename = this.hasSelectedFileOrFolder() && !protectedItem && !isTracksDirectory;
            let canReorder = isTracksDirectory;
            let needsDivider = canMove || canRename || canReorder;
            let trackPosition = 0;
            let compactVertical = this.state.windowHeight < 700;
            let canSelectFile = this.state.hasSelection && !this.isFolderArtwork(this.state.selectedFile);


            return this.props.open &&
                (
                    <DialogEx
                        fullScreen={this.state.fullScreen}
                        onClose={() => {
                            if (this.state.reordering) {
                                this.setState({ reordering: false, dragState: null });
                            } else {
                                this.props.onCancel();
                            }
                        }}
                        onEnterKey={() => {
                            if (this.state.reordering) {
                                this.setState({ reordering: false, dragState: null });
                            } else if (this.state.multiSelect) {
                                this.setState({ multiSelect: false, selectedFiles: [] });
                            } else {
                                this.openSelectedFile();
                            }
                        }}
                        open={this.props.open} tag="fileProperty"
                        fullWidth maxWidth="md"
                        PaperProps={
                            this.state.fullScreen ?
                                {}
                                :
                                {
                                    style: {
                                        minHeight: "90%",
                                        maxHeight: "90%",
                                    }
                                }}
                    >
                        <DialogTitle style={{
                            paddingBottom: 0,
                            background: this.state.reordering || this.state.multiSelect ?
                                (isDarkMode() ? "#523" : "#EDF")
                                : undefined,
                            marginBottom: 8, paddingTop: 0
                        }} >
                            {this.state.reordering && (
                                <Toolbar style={{ padding: 0 }}>
                                    <IconButtonEx
                                        tooltip="Close"
                                        edge="start"
                                        color="inherit"
                                        aria-label="cancel"
                                        style={{ opacity: 0.6 }}
                                        onClick={() => { this.setState({ reordering: false, dragState: null }); }
                                        }
                                    >
                                        <CloseIcon style={{ width: 24, height: 24 }} />
                                    </IconButtonEx>
                                    <Typography noWrap component="div" sx={{ flexGrow: 1 }}>
                                        Reorder files
                                    </Typography>
                                </Toolbar>

                            )}
                            {this.state.multiSelect && (
                                <Toolbar style={{ padding: 0 }}>
                                    <IconButtonEx
                                        tooltip="Close"
                                        edge="start"
                                        color="inherit"
                                        aria-label="cancel"
                                        style={{ opacity: 0.6 }}
                                        onClick={() => {
                                            this.handleMultisSelectClose();
                                        }}
                                    >
                                        <CloseIcon style={{ width: 24, height: 24 }} />
                                    </IconButtonEx>
                                    <Typography noWrap component="div" sx={{ flexGrow: 1 }}>
                                        {this.state.selectedFiles.length.toString() + " files selected."}
                                    </Typography>
                                    <Button variant="dialogSecondary"
                                        startIcon={<OldDeleteIcon />}
                                        onClick={() => {
                                            this.handleDelete();
                                        }}
                                    >
                                        Delete
                                    </Button>
                                    <IconButtonEx
                                        tooltip="More..."
                                        aria-label="display more actions"
                                        edge="end"
                                        color="inherit"
                                        style={{ opacity: 0.6 }}
                                        onClick={(ev) => { this.handleMenuMultiSelectOpen(ev); }}
                                        disabled={protectedDirectory}

                                    >
                                        <MoreIcon />
                                    </IconButtonEx>
                                    <Menu
                                        id="menu-multi-select"
                                        anchorEl={this.state.menuMultiselectAnchorEl}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right',
                                        }}
                                        keepMounted
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                        open={this.state.menuMultiselectAnchorEl !== null}
                                        onClose={() => { this.handleMenuMultiSelectClose(); }}
                                    >
                                        {canMove && (<MenuItem onClick={() => { this.handleMenuMultiSelectClose(); this.handleMove(); }}>Move</MenuItem>)}
                                        {canMove && (<MenuItem onClick={() => { this.handleMenuMultiSelectClose(); this.handleCopy(); }}>Copy</MenuItem>)}
                                    </Menu>

                                </Toolbar>
                            )}
                            {!(this.state.reordering || this.state.multiSelect) && (
                                <>
                                    <Toolbar style={{ padding: 0 }}>
                                        <IconButtonEx
                                            tooltip="Back"
                                            edge="start"
                                            color="inherit"
                                            aria-label="back"
                                            style={{ opacity: 0.6 }}
                                            onClick={() => { this.props.onCancel(); }}
                                        >
                                            <ArrowBackIcon style={{ width: 24, height: 24 }} />
                                        </IconButtonEx>
                                        <Typography noWrap component="div" sx={{ flexGrow: 1 }}>
                                            {this.props.fileProperty.label}
                                        </Typography>

                                        <IconButtonEx
                                            tooltip="New folder"
                                            aria-label="new folder"
                                            edge="end"
                                            color="inherit"
                                            style={{ opacity: 0.6, marginRight: 8 }}
                                            onClick={(ev) => { this.onNewFolder(); }}
                                            disabled={protectedDirectory}
                                        >
                                            <CreateNewFolderIcon />
                                        </IconButtonEx>


                                        <IconButtonEx
                                            tooltip="More..."
                                            aria-label="display more actions"
                                            edge="end"
                                            color="inherit"
                                            style={{ opacity: 0.6 }}
                                            onClick={(ev) => { this.handleMenuOpen(ev); }}
                                            disabled={protectedDirectory}

                                        >
                                            <MoreIcon />
                                        </IconButtonEx>
                                        <Menu
                                            id="menu-appbar"
                                            anchorEl={this.state.menuAnchorEl}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right',
                                            }}
                                            keepMounted
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'right',
                                            }}
                                            open={this.state.menuAnchorEl !== null}
                                            onClose={() => { this.handleMenuClose(); }}
                                        >
                                            <MenuItem onClick={() => { this.handleMenuClose(); this.onNewFolder(); }}>New folder</MenuItem>
                                            {(needsDivider) && (<Divider />)}
                                            {canMove && (<MenuItem onClick={() => { this.handleMenuClose(); this.handleMove(); }}>Move</MenuItem>)}
                                            {canMove && (<MenuItem onClick={() => { this.handleMenuClose(); this.handleCopy(); }}>Copy</MenuItem>)}
                                            {canRename && this.hasSelectedFileOrFolder() && !protectedItem && (<MenuItem onClick={() => {
                                                this.handleMenuClose(); this.onRename();
                                            }}>Rename</MenuItem>)}
                                            {canReorder && (
                                                <MenuItem onClick={() => { this.handleMenuClose(); this.onReorder(); }}>Reorder</MenuItem>)}
                                        </Menu>
                                    </Toolbar>
                                </>

                            )}
                            <div style={{ flex: "0 0 auto", marginLeft: 0, marginRight: 0, overflowX: "clip" }}>
                                {this.renderBreadcrumbs()}
                            </div>

                        </DialogTitle>
                        <DialogContent dividers style={{
                            paddingLeft: 0, paddingRight: 0, paddingTop: 0, colorScheme: (isDarkMode() ? "dark" : "light"),
                            position: "relative"
                        }}
                            ref={(element: HTMLDivElement | null) => { this.scrollContainerElementRef = element; }}
                        >

                            <div style={{
                                paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
                                display: this.state.loading ? "flex" : "none", flexFlow: "column nowrap",
                                justifyContent: "stretch", alignItems: "center",
                                position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10
                            }}
                            >
                                {this.state.showProgress && (
                                    <>
                                        <div style={{ flex: "1 1 1px" }} />
                                        <CircularProgress />
                                        <div style={{ flex: "2 2 1px" }} />
                                    </>
                                )}
                            </div>

                            <div
                                ref={(element) => { this.listContainerElementRef = element; this.onMeasureRef(element); }}
                                style={{
                                    flex: "1 1 100%", display: "flex", flexFlow: "row wrap",
                                    position: "relative", justifyContent: "flex-start", alignContent: "flex-start",
                                    paddingLeft: 16, paddingBottom: 16, paddingTop: 16,
                                }}>
                                {
                                    (this.state.columns !== 0) && // don't render until we have number of columns derived from layout.
                                    this.state.fileResult.files.map(
                                        (value: FileEntry, index: number) => {

                                            if (this.state.reordering && !value.metadata) {
                                                return null; // don't render non-track files when reordering.
                                            }
                                            if (this.state.reordering && this.isFolderArtwork(value.pathname)) {
                                                return null;
                                            }
                                            let displayValue = value.displayName;
                                            if (displayValue === "") {
                                                displayValue = "<none>";
                                            }
                                            let dataPosition = "";
                                            let myTrackPosition = trackPosition;

                                            if (value.metadata && value.metadata.track) {
                                                dataPosition = trackPosition.toString();
                                                ++trackPosition;
                                                this.maxPosition = trackPosition;
                                            }
                                            let selected = false;
                                            if (this.state.reordering) {
                                                selected = false;
                                            } else if (this.state.multiSelect) {
                                                selected = this.state.selectedFiles.indexOf(value.pathname) !== -1;
                                            } else {
                                                selected = value.pathname === this.state.selectedFile;
                                            }
                                            let selectBg = selected ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.0)";
                                            if (isDarkMode()) {
                                                selectBg = selected ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.0)";
                                            }
                                            let scrollRef: ((element: HTMLDivElement | null) => void) | undefined = undefined;
                                            if (selected) {
                                                scrollRef = (element) => { this.onScrollRef(element) };
                                            }
                                            let dragOffset = 0;
                                            let dragLeft = 0;
                                            let dragState = this.state.dragState;
                                            let zIndex: number | undefined = undefined;
                                            let background: string | undefined = undefined;
                                            if (dragState && value.metadata) {
                                                if (myTrackPosition !== dragState.from) {
                                                    if (myTrackPosition >= dragState.to && myTrackPosition < dragState.from) {
                                                        dragOffset = dragState.height;
                                                    } else if (myTrackPosition > dragState.from && myTrackPosition <= dragState.to) {
                                                        dragOffset = -dragState.height;
                                                    }
                                                } else {
                                                    dragOffset = dragState.dragElementDy + 5;
                                                    dragLeft = 5;
                                                    zIndex = 1000;
                                                    background = isDarkMode() ? "#555" : "#EEF";
                                                }
                                            }
                                            let dragButtonStyle: React.CSSProperties = {
                                                width: columnWidth, flex: "0 0 auto", height: (value.metadata && !compactVertical) ? 64 : 48,
                                                position: "relative",
                                                top: dragOffset,
                                                left: dragLeft,
                                                zIndex: zIndex,
                                                background: background,
                                            };
                                            return (
                                                <DraggableButtonBase key={value.pathname}
                                                    longPressDelay={this.state.reordering ? 300 : undefined}
                                                    data-position={dataPosition}
                                                    data-pathname={
                                                        value.metadata ? value.metadata.fileName : null
                                                    }
                                                    instantMouseLongPress={this.state.reordering}

                                                    style={dragButtonStyle}
                                                    onClick={(e) => this.handleFileClick(e, value)}
                                                    onDoubleClick={() => { this.onDoubleClickValue(value.pathname); }}

                                                    onLongPressEnd={(e) => {
                                                        this.handleLongPressEnd(e, value);
                                                    }
                                                    }
                                                    onLongPressStart={(currentTarget, e) => {
                                                        return this.handleLongPressStart(currentTarget, e, value);
                                                    }
                                                    }
                                                    onLongPressMove={(e) => {
                                                        this.handleLongPressMove(e);
                                                    }
                                                    }

                                                >
                                                    <div ref={scrollRef} style={{ position: "absolute", background: selectBg, width: "100%", height: "100%", borderRadius: 4 }} />
                                                    {value.metadata ?
                                                        (!compactVertical ?
                                                            (
                                                                <div style={{
                                                                    display: "flex", flexFlow: "row nowrap", textOverflow: "ellipsis",
                                                                    justifyContent: "start", alignItems: "center", width: "100%", height: "100%"
                                                                }}>
                                                                    {
                                                                        this.isFolderArtwork(value.pathname) ? (
                                                                            <img
                                                                                onDragStart={(e) => { e.preventDefault(); }}
                                                                                src={this.getTrackThumbnail(value)}
                                                                                style={{ width: 24, height: 24, margin: 20, borderRadius: 4 }} />
                                                                        ) : (
                                                                            <img
                                                                                onDragStart={(e) => { e.preventDefault(); }}
                                                                                src={this.getTrackThumbnail(value)}
                                                                                style={{ width: 48, height: 48, margin: 8, borderRadius: 4 }} />

                                                                        )
                                                                    }
                                                                    <div style={{
                                                                        flex: "1 1 1px", display: "flex", flexFlow: "column nowrap",
                                                                        marginLeft: 8,
                                                                        textOverflow: "ellipsis", justifyContent: "center", alignItems: "stretch"
                                                                    }}>
                                                                        <Typography noWrap
                                                                            className={classes.secondaryText}
                                                                            variant="body2"
                                                                            style={{ flex: "0 0 auto", textOverflow: "ellipsis", textAlign: "left", marginBottom: 4 }}>
                                                                            {getTrackTitle(value.pathname, value.metadata)}
                                                                        </Typography>
                                                                        <Typography noWrap className={classes.secondaryText}
                                                                            variant="body2"
                                                                            color="textSecondary"
                                                                            style={{ flex: "0 0 auto", textOverflow: "ellipsis", textAlign: "left", fontSize: "0.95em" }}>
                                                                            {this.getAlbumTitle(value)}

                                                                        </Typography>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div style={{
                                                                    display: "flex", flexFlow: "row nowrap", textOverflow: "ellipsis",
                                                                    justifyContent: "start", alignItems: "center", width: "100%", height: "100%"
                                                                }}>
                                                                    <img
                                                                        onDragStart={(e) => { e.preventDefault(); }}
                                                                        src={this.getTrackThumbnail(value)}
                                                                        style={{ width: 24, height: 24, margin: 8, borderRadius: 4 }} />
                                                                    <div style={{
                                                                        flex: "1 1 1px", display: "flex", flexFlow: "column nowrap",
                                                                        marginLeft: 8,
                                                                        textOverflow: "ellipsis", justifyContent: "center", alignItems: "stretch"
                                                                    }}>
                                                                        <Typography noWrap
                                                                            className={classes.secondaryText}
                                                                            variant="body2"
                                                                            style={{ flex: "0 0 auto", textOverflow: "ellipsis", textAlign: "left", marginBottom: 4 }}>
                                                                            {this.getCompactTrackTitle(value)}
                                                                        </Typography>
                                                                    </div>
                                                                </div>
                                                            )

                                                        ) : (
                                                            <div style={{ display: "flex", flexFlow: "row nowrap", textOverflow: "ellipsis", justifyContent: "start", alignItems: "center", width: "100%", height: "100%" }}>
                                                                {this.getIcon(value, this.isTracksDirectory() && !compactVertical)}
                                                                <Typography noWrap className={classes.secondaryText} variant="body2" style={{ flex: "1 1 auto", textAlign: "left" }}>{displayValue}</Typography>
                                                            </div>
                                                        )}

                                                </DraggableButtonBase>
                                            );
                                        }
                                    )
                                }
                            </div>
                        </DialogContent>
                        {(!this.state.reordering && !this.state.multiSelect) && (
                            <>
                                <DialogActions style={{ justifyContent: "stretch", width: "100%" }}>
                                    <div style={{display: "flex", flexFlow: "column nowrap", width: "100%", alignItems: "stretch", }}>
                                    {isToobNamModelFile && (
                                        <div style={{
                                            display: "flex", flexFlow: "row nowrap", justifyContent: "center",
                                            alignItems: "center", width: "100%"
                                        }}>
                                            <Typography variant="body2" >
                                                Download model files from <LinkEx
                                                    href="https://www.tone3000.com/search" target="_blank">TONE3000</LinkEx>
                                            </Typography>
                                            <IconButtonEx tooltip="Help"
                                            onClick={(e) => { this.handleTone3000Help(e); }} aria-label="help" edge="end" color="inherit" style={{ opacity: 0.6, marginLeft: 8 }}
                                            >
                                                <HelpOutlineIcon />
                                            </IconButtonEx>
                                        </div>

                                    )}
                                    {isToobMLModelFile && (
                                        <div style={{
                                            display: "flex", flexFlow: "row nowrap", justifyContent: "center", width: "100%",
                                            alignItems: "center"
                                        }}>
                                            <Typography variant="body2" >
                                                Download model files from <LinkEx
                                                    href="https://github.com/GuitarML/ToneLibrary/releases/download/v1.0/Proteus_Tone_Packs.zip" target="_blank">GuitarML</LinkEx>
                                            </Typography>
                                            <IconButtonEx tooltip="Help"
                                            onClick={(e) => { this.handleGuitarMlHelp(e); }} aria-label="help" edge="end" color="inherit" style={{ opacity: 0.6, marginLeft: 8 }}
                                            >
                                                <HelpOutlineIcon />
                                            </IconButtonEx>
                                        </div>

                                    )}


                                    {this.state.windowWidth > 500 ? (
                                        <div style={{ display: "flex", width: "100%", alignItems: "center", flexFlow: "column nowrap" }}>

                                            <div style={{ flex: "1 1 100%", display: "flex", width: "100%", alignItems: "center", flexFlow: "row nowrap" }}>
                                                <IconButtonEx style={{ visibility: (this.state.hasSelection ? "visible" : "hidden") }} aria-label="delete" component="label" color="primary"
                                                    tooltip="Delete selected file or folder"
                                                    disabled={!this.state.hasSelection || this.state.selectedFile === "" || protectedItem}
                                                    onClick={() => this.handleDelete()} >
                                                    <OldDeleteIcon fontSize='small' />
                                                </IconButtonEx>

                                                <ButtonEx tooltip="Upload file" style={{ flex: "0 0 auto" }} aria-label="upload" variant="text" startIcon={<FileUploadIcon />}
                                                    onClick={() => { this.setState({ openUploadFileDialog: true }) }} disabled={protectedDirectory}
                                                >
                                                    <div>Upload</div>
                                                </ButtonEx>

                                                <ButtonEx tooltip="Download file" style={{ flex: "0 0 auto" }} aria-label="upload" variant="text" startIcon={<FileDownloadIcon />}
                                                    onClick={() => { this.handleDownloadFile(); }} disabled={protectedDirectory || !this.state.hasFileSelection}
                                                >
                                                    <div>Download</div>
                                                </ButtonEx>

                                                <div style={{ flex: "1 1 auto" }}>&nbsp;</div>

                                                <Button variant="dialogSecondary" onClick={() => {
                                                    this.props.onApply(this.props.fileProperty, this.state.initialSelection);
                                                    this.props.onCancel();
                                                }} aria-label="cancel">
                                                    Cancel
                                                </Button>
                                                <Button variant="dialogPrimary" style={{ flex: "0 0 auto" }}
                                                    onClick={() => { this.openSelectedFile(); }}

                                                    disabled={(!canSelectFile)
                                                    } aria-label="select"
                                                >
                                                    {okButtonText}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ width: "100%" }}>
                                            <div style={{ display: "flex", width: "100%", alignItems: "center", flexFlow: "row nowrap" }}>
                                                <IconButtonEx tooltip="Delete" style={{ visibility: (this.state.hasSelection ? "visible" : "hidden") }} aria-label="delete" component="label" color="primary"
                                                    disabled={!this.state.hasSelection || this.state.selectedFile === "" || protectedItem}
                                                    onClick={() => this.handleDelete()} >
                                                    <OldDeleteIcon fontSize='small' />
                                                </IconButtonEx>

                                                <Button style={{ flex: "0 0 auto" }} aria-label="upload" variant="text" startIcon={<FileUploadIcon />}
                                                    onClick={() => { this.setState({ openUploadFileDialog: true }) }} disabled={protectedDirectory}
                                                >
                                                    <div>Upload</div>
                                                </Button>

                                                <Button style={{ flex: "0 0 auto" }} aria-label="upload" variant="text" startIcon={<FileDownloadIcon />}
                                                    onClick={() => { this.handleDownloadFile(); }} disabled={protectedDirectory || !this.state.hasFileSelection}

                                                >
                                                    <div>Download</div>
                                                </Button>

                                                <div style={{ flex: "1 1 auto" }}>&nbsp;</div>
                                            </div>
                                            <div style={{ display: "flex", width: "100%", alignItems: "center", flexFlow: "row nowrap" }}>
                                                <div style={{ flex: "1 1 auto" }}>&nbsp;</div>

                                                <Button variant="dialogSecondary" onClick={() => { this.props.onCancel(); }} aria-label="cancel">
                                                    Cancel
                                                </Button>
                                                <Button variant="dialogPrimary" style={{ flex: "0 0 auto" }}
                                                    onClick={() => { this.openSelectedFile(); }}

                                                    disabled={!canSelectFile}
                                                    aria-label="select"
                                                >
                                                    {okButtonText}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                </DialogActions>
                            </>
                        )}
                        <UploadFileDialog
                            open={this.state.openUploadFileDialog}
                            onClose=
                            {
                                () => {
                                    this.setState({ openUploadFileDialog: false });
                                }
                            }
                            isTracksDirectory={this.isTracksDirectory()}
                            uploadPage={
                                "uploadUserFile?directory=" + encodeURIComponent(this.state.currentDirectory)
                                + "&id=" + this.props.instanceId.toString()
                                + "&property=" + encodeURIComponent(this.props.fileProperty.patchProperty)
                                + "&ext="
                                + encodeURIComponent(this.getFileExtensionList(this.props.fileProperty))
                            }
                            onUploaded={() => { this.requestFiles(this.state.navDirectory); }}
                            fileProperty={this.props.fileProperty}


                        />
                        <OkCancelDialog open={this.state.openConfirmDeleteDialog}

                            text={
                                this.state.multiSelect ?
                                    ("Are you sure you want to delete the selected files and directories and all their contents?")
                                    : (this.state.selectedFileIsDirectory
                                        ? "Are you sure you want to delete the selected directory and all its contents?"
                                        : "Are you sure you want to delete the selected file?"
                                    )
                            }
                            okButtonText="Delete"
                            onOk={() => this.handleConfirmDelete()}
                            onClose={() => {
                                this.setState({ openConfirmDeleteDialog: false });
                            }}

                        />
                        <OkCancelDialog open={this.state.confirmCopyDialogState !== null}
                            text={
                                "The target file already exists. Would you like to overwrite it?"}
                            okButtonText="Overwrite"
                            onOk={() => { this.handleConfirmCopy(); }}
                            onClose={() => {
                                this.setState({ confirmCopyDialogState: null });
                            }}

                        />

                        {
                            this.state.newFolderDialogOpen && (
                                <RenameDialog open={this.state.newFolderDialogOpen} defaultName=""
                                    onOk={(newName) => { this.setState({ newFolderDialogOpen: false }); this.onExecuteNewFolder(newName) }}
                                    onClose={() => { this.setState({ newFolderDialogOpen: false }); }}
                                    title="New folder"
                                    acceptActionName="OK"
                                />
                            )
                        }
                        {
                            this.state.renameDialogOpen && (
                                <RenameDialog open={this.state.renameDialogOpen} defaultName={this.renameDefaultName()}
                                    title="Rename"
                                    onOk={(newName) => { this.setState({ renameDialogOpen: false }); this.onExecuteRename(newName) }}
                                    onClose={() => { this.setState({ renameDialogOpen: false }); }}
                                    acceptActionName="OK"
                                />

                            )
                        }
                        {
                            (this.state.moveDialogOpen || this.state.copyDialogOpen)
                            && (
                                (
                                    <FilePropertyDirectorySelectDialog
                                        open={this.state.moveDialogOpen || this.state.copyDialogOpen}
                                        dialogTitle={this.state.moveDialogOpen ? "Move to" : "Copy Link to"}
                                        uiFileProperty={this.props.fileProperty}
                                        defaultPath={this.getDefaultPath()}
                                        selectedFile={this.state.selectedFile}
                                        excludeDirectory={
                                            this.isDirectory(this.state.selectedFile)
                                                ? this.state.selectedFile : ""}
                                        onClose={() => { this.setState({ moveDialogOpen: false, copyDialogOpen: false }); }}
                                        onOk={
                                            (path) => {
                                                this.setState({ moveDialogOpen: false, copyDialogOpen: false });
                                                this.setDefaultPath(path);
                                                if (this.state.copyDialogOpen) {
                                                    this.onExecuteCopy(path);
                                                } else {
                                                    this.onExecuteMove(path);
                                                }
                                            }
                                        }

                                    />
                                )
                            )
                        }
                        {/* {this.state.openTone3000Dialog && (
                            <Tone3000Dialog
                                open={this.state.openTone3000Dialog}
                                onClose={() => this.setState({ openTone3000Dialog: false })}
                            />
                        )} */}
                        {this.state.openTone3000Help && (
                            <Tone3000HelpDialog
                                open={this.state.openTone3000Help}
                                onClose={() => this.setState({ openTone3000Help: false })}
                            />
                        )}
                        {this.state.openGuitarMlHelp && (
                            <GuitarMLHelpDialog
                                open={this.state.openGuitarMlHelp}
                                onClose={() => this.setState({ openGuitarMlHelp: false })}
                            />
                        )}
                    </DialogEx>
                );
        }
        openSelectedFile(): void {
            if (this.state.multiSelect || this.state.reordering) {
                return;
            }
            if (this.isFolderArtwork(this.state.selectedFile)) {
                return;
            }
            if (this.isDirectory(this.state.selectedFile)) {
                this.requestFiles(this.state.selectedFile);
                this.setState({ navDirectory: this.state.selectedFile });
            } else {
                this.props.onOk(this.props.fileProperty, this.state.selectedFile);
            }
        }

        private renameDefaultName(): string {
            let name = this.state.selectedFile;
            if (name === "") return "";
            if (this.isDirectory(name)) {
                return pathFileName(name);
            } else {
                return pathFileNameOnly(name);
            }
        }
        private handleMove(): void {
            this.setState({ moveDialogOpen: true });
        }
        private handleCopy(): void {
            this.setState({ copyDialogOpen: true });
        }
        private async onExecuteMoveMulti(newDirectory: string) {
            let files = this.state.selectedFiles.slice();
            let newFileList = this.state.selectedFiles.slice();
            try {
                for (let file of files) {
                    let fileName = pathFileName(file);
                    let oldFilePath = pathConcat(this.state.navDirectory, fileName);
                    let newFilePath = pathConcat(newDirectory, fileName);

                    await this.model.renameFilePropertyFile(oldFilePath, newFilePath, this.props.fileProperty);
                    let index = newFileList.indexOf(file);
                    if (index !== -1) {
                        newFileList.splice(index, 1);
                    }

                }
            } catch (e) {
                this.model.showAlert(e);
            }
            // update state to refelect what we did.
            if (!this.mounted) {
                return;
            }
            if (newFileList.length === 0) {
                this.setState({
                    multiSelect: false,
                    selectedFiles: []
                });
            } else {
                this.setState({
                    multiSelect: true,
                    selectedFiles: newFileList,
                });
            }
            this.requestFiles(this.state.navDirectory);
        }
        private onExecuteMove(newDirectory: string) {
            if (this.state.multiSelect) {
                this.onExecuteMoveMulti(newDirectory);
                return;
            }
            let fileName = pathFileName(this.state.selectedFile);
            let oldFilePath = pathConcat(this.state.navDirectory, fileName);
            let newFilePath = pathConcat(newDirectory, fileName);

            this.model.renameFilePropertyFile(oldFilePath, newFilePath, this.props.fileProperty)
                .then(() => {
                    this.requestFiles(this.state.navDirectory);
                })
                .catch((e) => {
                    this.model.showAlert(e.toString());
                });

        }
        private handleConfirmCopy() {
            if (this.state.confirmCopyDialogState) {
                this.model.copyFilePropertyFile(
                    this.state.confirmCopyDialogState.oldFilePath,
                    this.state.confirmCopyDialogState.newFilePath,
                    this.props.fileProperty, true)
                    .then((filename) => {
                        this.requestFiles(this.state.navDirectory);
                    })
                    .catch((e) => {
                        this.model.showAlert(e.toString());
                    });
                this.setState({ confirmCopyDialogState: null });
            }
        }
        private async onExecuteCopyMulti(newDirectory: string) {

            let files = this.state.selectedFiles.slice();
            let fileProperty = this.props.fileProperty;
            try {
                for (let fileName of files) {
                    let oldFilePath = pathConcat(this.state.navDirectory, fileName);
                    let newFilePath = pathConcat(newDirectory, fileName);

                    await this.model.copyFilePropertyFile(oldFilePath, newFilePath, fileProperty, true);
                }
            } catch (e) {
                this.model.showAlert(e);
            }
            // update state to reflect what we did.
            if (!this.mounted) {
                return;
            }
            this.requestFiles(this.state.navDirectory);
        }
        private onExecuteCopy(newDirectory: string) {
            this.setState({ copyDialogOpen: false });
            if (this.state.multiSelect) {
                this.onExecuteCopyMulti(newDirectory);
                return;
            }
            let fileName = pathFileName(this.state.selectedFile);
            let oldFilePath = pathConcat(this.state.navDirectory, fileName);
            let newFilePath = pathConcat(newDirectory, fileName);

            this.model.copyFilePropertyFile(oldFilePath, newFilePath, this.props.fileProperty, false)
                .then((filename) => {
                    if (filename === "") {
                        // the file already exists. prompt for overrwrite.
                        this.setState({
                            confirmCopyDialogState: {
                                fileName: fileName,
                                oldFilePath: oldFilePath,
                                newFilePath
                            }
                        });

                    } else {
                        this.requestFiles(this.state.navDirectory);
                        this.setState({
                            selectedFile: filename,
                            selectedFileIsDirectory: this.isDirectory(filename),
                            selectedFileProtected: false
                        });
                        this.requestScroll = true;
                    }
                })
                .catch((e) => {
                    this.model.showAlert(e.toString());
                });

        }

        private onRename(): void {
            this.setState({ renameDialogOpen: true });
        }
        private onReorder(): void {
            this.setState({ reordering: true });
        }
        private onExecuteRename(newName: string) {
            let newPath: string = "";
            let oldPath: string = "";
            if (this.isDirectory(this.state.selectedFile)) {
                let oldName = pathFileName(this.state.selectedFile);
                if (oldName === newName) return;
                oldPath = pathConcat(this.state.navDirectory, oldName);
                newPath = pathConcat(this.state.navDirectory, newName);;
            } else {
                let oldName = pathFileNameOnly(this.state.selectedFile);
                if (oldName === newName) return;
                let extension = pathExtension(this.state.selectedFile);
                oldPath = pathConcat(this.state.navDirectory, oldName + extension);
                newPath = pathConcat(this.state.navDirectory, newName + extension);
            }
            this.model.renameFilePropertyFile(oldPath, newPath, this.props.fileProperty)
                .then((newPath) => {
                    this.setState({ selectedFile: newPath });
                    this.requestFiles(this.state.navDirectory);
                    this.requestScroll = true

                })
                .catch((e) => {
                    this.model.showAlert(e.toString());
                });
        }

        private onNewFolder(): void {
            this.setState({ newFolderDialogOpen: true });
        }

        private onExecuteNewFolder(newName: string) {
            this.model.createNewSampleDirectory(pathConcat(this.state.navDirectory, newName), this.props.fileProperty)
                .then((newPath) => {
                    this.setState({
                        selectedFile: newPath,
                        selectedFileIsDirectory:
                            true, selectedFileProtected: false
                    });
                    this.requestFiles(this.state.navDirectory);
                    this.requestScroll = true
                })
                .catch((e) => {
                    this.model.showAlert(e.toString());
                }
                );
        }
    },
    styles);