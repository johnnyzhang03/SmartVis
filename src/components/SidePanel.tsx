import { eventCenter } from '../event';
import { Button } from 'antd';
import FileUpload from "./FileUpload";
import { TemperatureSelect } from './TemperatureSelect';
import React, { useState } from 'react';
import { UserPromptInupt } from './UserPromptInput';
import GrpahChoices from './GraphChoices';

export default function SidePanel() {
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [showChoices, setShowChoices] = useState(false);

function handleGenerateClick() {
    if (uploadedFile) {
        eventCenter.emit('addNewCell', uploadedFile);
        setShowChoices(true);
    } else {
        alert("No file uploaded.");
    }
};
return (
    <div className='container'>
    {showChoices ? (
        <GrpahChoices/>
    ) : (
        <>
            <div className='upload'>
                <FileUpload setFile={setUploadedFile}/>
            </div>
            <div className='user-prompt'>
                <UserPromptInupt></UserPromptInupt>
            </div>
            <div className='temperature'>
                <TemperatureSelect></TemperatureSelect>
            </div>
            <div className='button-container'>
                <Button type="primary" onClick={handleGenerateClick}>Generate</Button>
            </div>
        </>
    )}
    </div>
    )
}