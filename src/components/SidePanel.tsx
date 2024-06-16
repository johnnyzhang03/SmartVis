import { Button } from 'antd';
import FileUpload from "./FileUpload";
import { TemperatureSelect } from './TemperatureSelect';
import React, { useState } from 'react';
import { UserPromptInupt } from './UserPromptInput';
import ChartChoices from './ChartChoices';
import { generateChart, ChartInformation } from '../openai';

export default function SidePanel() {
let initialList: ChartInformation[] = [];
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [generateClicked, setGenerateClicked] = useState(false);
const [showCharts, setShowCharts] = useState(false);
const [responseList, setResponseList] = useState(initialList);

async function handleGenerateClick() {
    if (uploadedFile) {
        setGenerateClicked(true);
        let list = await generateChart(uploadedFile);
        setResponseList(list as ChartInformation[]); 
        setShowCharts(true); 
    } else {
        alert("No file uploaded.");
    }
};
return (
    <div className='container'>
    {generateClicked ? (
        <ChartChoices showCharts={showCharts} responseList={responseList} />
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