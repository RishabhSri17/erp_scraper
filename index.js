const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const outputPath = path.join(__dirname, 'results.txt');


const encodedData = 'MjQ2N3wyMDIzfDN8Nnw3M3wyMDIx';


function decodeBase64(encoded) {
    return Buffer.from(encoded, 'base64').toString('utf-8');
}


const decodedData = decodeBase64(encodedData);
console.log('Decoded data:', decodedData);

const components = decodedData.split('|');
const initialFirstComponent = parseInt(components[0]); 

const baseUrl = 'https://erpresult.manit.ac.in/';

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false 
    })
});

async function fetchHTML(url) {
    try {
        const response = await axiosInstance.get(url);
        return response.data; 
    } catch (error) {
        console.error('Error fetching HTML:', error.message);
        return null;
    }
}

function extractDataFromHTML(html) {
    const $ = cheerio.load(html); 

    let scholarNo = '';
    let candidateName = '';
    let result = '';
    let sgpa = '';

    $('.tdHead').each((index, element) => {
        const text = $(element).text().trim();
        if (text === 'Scholar No') {
            scholarNo = $(element).next('.tdValue').find('b').text().trim();
            return false; 
        }
    });

    $('.tdHead').each((index, element) => {
        const text = $(element).text().trim();
        if (text === 'Candidate Name') {
            candidateName = $(element).next('.tdValue').text().trim();
            return false; 
        }
    });

    $('tr[style="font-weight: bold; font-size: 8px;"]').each((index, element) => {
        const td1 = $(element).find('td').eq(0).text().trim();
        const td2 = $(element).find('td').eq(1).text().trim();

        if (td1.startsWith('Result')) {
            result = td1.replace('Result :', '').trim(); 
        }
        if (td2.startsWith('SGPA')) {
            sgpa = td2.replace('SGPA :', '').trim(); 
        }
    });

    return { scholarNo, candidateName, result , sgpa };
}

async function fetchResults(start, end) {
    let output = '';
    
    for (let i = start; i <= end; i++) {
        components[0] = i.toString();

        const updatedEncodedData = Buffer.from(components.join('|')).toString('base64');

        const url = `${baseUrl}?data=${updatedEncodedData}&RegSession=${components[0]}&RegSemester_type_id_code=${components[1]}&effective_from=${components[2]}&semsterNOIdCode=${components[3]}&programMasterId=${components[4]}&operation=show-result`;
        
        try {
            const html = await fetchHTML(url);

            if (html) {
                const extractedData = extractDataFromHTML(html);
                console.log(`Results for RegSession ${components[0]}:`);
                console.log('Scholar No:', extractedData.scholarNo);
                console.log('Candidate Name:', extractedData.candidateName);
                console.log('Result :', extractedData.result);
                console.log('SGPA :', extractedData.sgpa);
                console.log('\n');
                output += `Results for RegSession ${components[0]}:\n`;
                output += `Scholar No: ${extractedData.scholarNo}\n`;
                output += `Candidate Name: ${extractedData.candidateName}\n`;
                output += `Result : ${extractedData.result}\n\n`;
                output += `SGPA : ${extractedData.sgpa}\n\n`;
            } else {
                console.error(`No HTML content fetched for RegSession ${components[0]}`);
                output += `No HTML content fetched for RegSession ${components[0]}\n\n`;
            }
        } catch (error) {
            console.error(`Error fetching results for RegSession ${components[0]}:`, error.message);
            output += `Error fetching results for RegSession ${components[0]}: ${error.message}\n\n`;
        }
    }

    fs.writeFileSync(outputPath, output);
    console.log('Data written to results.txt');
}


fetchResults(2000, 5400);
