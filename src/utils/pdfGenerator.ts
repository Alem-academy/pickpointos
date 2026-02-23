import html2pdf from 'html2pdf.js';

/**
 * Converts an HTML string into a PDF File object.
 * 
 * @param htmlContent The raw HTML string to convert
 * @param filename The desired output filename
 * @returns A Promise that resolves to the generated PDF File
 */
export async function generatePdfFromHtml(htmlContent: string, filename: string): Promise<File> {
    return new Promise((resolve, reject) => {
        // Create a temporary hidden container to mount the HTML for rendering
        const container = document.createElement('div');
        container.innerHTML = htmlContent;
        // Keep it out of view but still part of the DOM temporarily if needed, 
        // though html2pdf can often handle standalone elements.
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        html2pdf()
            .set(opt)
            .from(container)
            .output('blob')
            .then((pdfBlob: Blob) => {
                document.body.removeChild(container);

                // Convert Blob to File
                const file = new File([pdfBlob], filename, { type: 'application/pdf' });
                resolve(file);
            })
            .catch((err: any) => {
                document.body.removeChild(container);
                console.error('Error generating PDF:', err);
                reject(err);
            });
    });
}
