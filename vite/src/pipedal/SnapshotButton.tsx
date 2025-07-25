/*
* MIT License
* 
* Copyright (c) 2024 Robin E. R. Davies
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is furnished to do
* so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import Typography from '@mui/material/Typography';
import IconButtonEx from './IconButtonEx';
import ButtonBase from '@mui/material/ButtonBase';
import ResizeResponsiveComponent from './ResizeResponsiveComponent';
import SaveIconOutline from '@mui/icons-material/Save';
import Button from "@mui/material/Button";
import EditIconOutline from '@mui/icons-material/Edit';
import { Snapshot } from './Pedalboard';
import { isDarkMode } from './DarkMode';

import { colorKeys, getBackgroundColor, getBorderColor } from './MaterialColors';
import { PiPedalModel, PiPedalModelFactory, SnapshotModifiedEvent } from './PiPedalModel';

export interface SnapshotButtonProps {
    snapshot: Snapshot | null;
    snapshotIndex: number;
    selected: boolean;
    largeText: boolean;
    collapseButtons: boolean;

    onEditSnapshot: (index: number) => void;
    onSaveSnapshot: (index: number) => void;
    onSelectSnapshot: (index: number) => void;
};

export interface SnapshotButtonState {
    modified: boolean;
    uiScale: number;
};

export default class SnapshotButton extends ResizeResponsiveComponent<SnapshotButtonProps, SnapshotButtonState> {
    private model: PiPedalModel;

    constructor(props: SnapshotButtonProps) {
        super(props);
        this.state = {
            modified: this.props.snapshot?.isModified ?? false,
            uiScale: 1.0
        };
        this.model = PiPedalModelFactory.getInstance();
        this.onSnapshotModified = this.onSnapshotModified.bind(this);

    }

    is2x3Layout(width: number, height: number) {
        return width * 2 < height * 3;
    }

    onWindowSizeChanged(width: number, height: number): void {
        let uiScale: number;
        if (this.is2x3Layout(width,height)) {
            uiScale = width / 400;
        } else {
            uiScale = (width/3)/(400/2);
        }
        if (height < width) {
            // 1 at 400, 2 at 600
            let hUiScale = (height-340)/(400-340);
            hUiScale += (height-400)/(460-400);
            uiScale = Math.min(hUiScale,uiScale);
        }
        if (uiScale < 1) uiScale = 1;
        if (uiScale > 4) uiScale = 4;
        this.setState({uiScale: uiScale});
    }

    onSnapshotModified(event: SnapshotModifiedEvent) {
        if (event.snapshotIndex === this.props.snapshotIndex) {
            this.setState({ modified: event.modified });
        }
    }
    componentDidMount(): void {
        super.componentDidMount?.();
        this.model.onSnapshotModified.addEventHandler(this.onSnapshotModified);
    }
    componentWillUnmount(): void {
        this.model.onSnapshotModified.removeEventHandler(this.onSnapshotModified);
        super.componentWillUnmount();
    }
    componentDidUpdate(
        prevProps: Readonly<SnapshotButtonProps>,
        prevState: Readonly<SnapshotButtonState>): void {
        super.componentDidUpdate?.(prevProps, prevState);

        if (this.props.snapshot !== prevProps.snapshot) {
            this.setState({
                modified: this.props.snapshot?.isModified ?? false
            })
        }
    }

    render() {
        let { snapshot, snapshotIndex, selected } = this.props;
        let { modified, uiScale } = this.state;

        // (snapshot: Snapshot | null, index: number) {
        //let state = this.state;
        let color: string;
        let bordercolor: string;
        if (snapshot) {
            if (colorKeys.indexOf(snapshot.color) === -1) {
                bordercolor = color = snapshot.color;
            } else {
                color = getBackgroundColor(snapshot.color);
                bordercolor = getBorderColor(snapshot.color);
            }
        } else {
            bordercolor = color = getBackgroundColor("grey");
        }
        let title = snapshot ? snapshot.name : "<unassigned>";
        if (modified) {
            title = title + "*";
        }
        let disabled = snapshot === null;

        let fontSize = (16*uiScale) + "px";
        return (
            <div style={{ display: "flex", position: "relative", flexGrow: 1, flexBasis: 1, flexFlow: "column nowrap", alignItems: "stretch", borderRadius: 16 }}>

                <ButtonBase style={{
                    display: "flex", flexGrow: 1, flexBasis: 1, flexFlow: "column nowrap", alignItems: "stretch", borderRadius: 16,
                    background: color,
                    boxShadow: "1px 3px 6px #00000090"
                }}
                    onMouseDown={(ev) => {
                        if (!selected) ev.stopPropagation();
                    }}

                    onClick={() => { if (snapshot) this.props.onSelectSnapshot(snapshotIndex); }}
                >
                    {/* select background mask*/}
                    <div style={{position: "absolute", left:0,top:0,right:0,bottom:0, visibility: this.props.selected ? "visible": "hidden",
                        background: isDarkMode() ? "#FFFFFF": "#000000", borderRadius: 16,
                        opacity: 0.2
                    }}
                    />
                    <div
                        style={{ flexGrow: 1, flexShrink: 1, display: "flex", flexFlow: "column nowrap", alignItems: "stretch" }}
                        onMouseDown={(ev) => {
                            if (disabled) ev.stopPropagation();
                        }}
                    >
                        <div style={{
                            flexGrow: 1, flexShrink: 1, display: "flex", flexFlow: "column nowrap", alignItems: "stretch", justifyContent: "center", margin: 6,
                            borderColor: selected ? bordercolor : "transparent", borderStyle: "solid", borderWidth: 3, borderRadius: 10
                        }}
                        >
                            <div style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>

                                <Typography display="block" color="textPrimary" align="center" variant="body1"
                                    style={{ fontSize: fontSize }}
                                >{title}</Typography>
                            </div>
                            <Typography variant="h3"
                                style={{
                                    position: "absolute",bottom: 0, left: 0, paddingBottom: 12, paddingLeft: 16, paddingRight: 12,
                                    pointerEvents: "none", opacity: 0.35, fontSize: "44px", fontWeight: 900, fontFamily: "Arial Black", fontStyle: "italic"
                                }}
                            >
                                {(snapshotIndex + 1).toString()}
                            </Typography>
                            <div style={{ height: 54, flexGrow: 0, flexShrink: 0 }}>
                                {/* placeholder where we will float the buttons, which can't be witin another button (tons of DOM validation warning messages in chrome) */}
                            </div>

                        </div>
                    </div>
                </ButtonBase >

                <div style={{ flexGrow: 0, position: "absolute", bottom: 0, right: 0, paddingBottom: 12, marginRight: 12 }} >
                    {!this.props.collapseButtons ? (
                        <div style={{ marginRight: 8, display: "flex", flexFlow: "row nowrap" }}>
                            <Button variant="dialogSecondary" startIcon={<SaveIconOutline />} color="inherit" style={{ textTransform: "none" }}
                                onMouseDown={(ev) => { ev.stopPropagation(); /*don't prop to card*/ }}
                                onMouseUp={(ev) => { ev.stopPropagation(); /*don't prop to card*/ }}
                                disabled={false}
                                onClick={(ev) => { ev.stopPropagation(); this.props.onSaveSnapshot(snapshotIndex); }}

                            >
                                Save
                            </Button>
                            <Button variant="dialogSecondary" color="inherit" startIcon={<EditIconOutline />} style={{ textTransform: "none" }}
                                onMouseDown={(ev) => { ev.stopPropagation();  /*don't prop to card*/ }}
                                onMouseUp={(ev) => { ev.stopPropagation(); /*don't prop to card*/ }}
                                disabled={disabled}
                                onClick={(ev) => { ev.stopPropagation(); this.props.onEditSnapshot(snapshotIndex); }}

                            >
                                Edit
                            </Button>
                        </div>

                    ) : (
                        <div style={{ marginLeft: "auto", marginRight: 8, display: "flex", flexFlow: "row nowrap" }}>
                            <div style={{ flexGrow: 1, flexBasis: 1 }} ></div>
                            <IconButtonEx tooltip="Save snapshot" color="inherit" style={{ opacity: 0.66 }} disabled={false}
                                onMouseDown={(ev) => { ev.stopPropagation(); /*don't prop to card*/ }}
                                onClick={() => { this.props.onSaveSnapshot(snapshotIndex); }}
                            >
                                <SaveIconOutline />
                            </IconButtonEx>
                            <IconButtonEx tooltip="Edit snapshot" color="inherit" disabled={disabled} style={{ opacity: 0.66 }}
                                onMouseDown={(ev) => { ev.stopPropagation();  /*don't prop to card*/ }}
                                onClick={() => { this.props.onEditSnapshot(snapshotIndex); }}

                            >
                                <EditIconOutline />
                            </IconButtonEx>
                        </div>
                    )}
                </div>
            </div >
        );
    }
}

