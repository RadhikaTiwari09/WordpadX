const editor = document.getElementById('editor');

const toggleButton = (btn) => btn.classList.toggle('active');

document.getElementById('fontFamily').addEventListener('change', (e) => {
    document.execCommand('fontName', false, e.target.value);
});

document.getElementById('fontSize').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, '7');
    let f = document.getElementsByTagName('font');

    for (let i = 0; i < f.length; i++) {
        if (f[i].size == '7') {
            f[i].removeAttribute('size');
            f[i].style.fontSize = e.target.value + 'px';
        }
    }
});

const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editor.focus();
};

const changeColor = (command, value) => {
    document.execCommand(command, false, value);
    editor.focus();
};

const updateCounts = () => {
    const text = editor.innerText;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = text.length;
    document.getElementById('wordCount').textContent = `Words: ${words}`;
    document.getElementById('charCount').textContent = `Characters: ${chars}`;
};

const saveDocument = () => {
    const content = editor.innerHTML;
    localStorage.setItem('wordpadContent', content);
    document.getElementById('autoSaveStatus').textContent = 'Auto-save: Saved';

    setTimeout(() => {
        document.getElementById('autoSaveStatus').textContent = 'Auto-save: On';
    }, 2000);
};

const autoSave = () => {
    saveDocument();
    setTimeout(autoSave, 30000);
};

const toggleSpellCheck = () => {
    editor.spellcheck = !editor.spellcheck;

    if (editor.spellcheck) alert("spell check enabled");
    else alert("spell check disabled");
};


const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            let transcript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            editor.innerText += transcript;

            updateCounts();
            setTimeout(() => {
                editor.scrollTop = editor.scrollHeight - editor.clientHeight;
            }, 0);
        };
        recognition.start();
        setTimeout(() => recognition.stop(), 10000);
    }
    else alert('voice input not supported in this browser');
};

const readAloud = () => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(editor.innerText);
        utterance.rate = 1;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
    }
    else alert('text to speech not supported');
};

const changeTheme = (theme) => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
};

const applyTemplate = (template) => {
    const templates = {
        letter: `
            <p>Hey there,</p>
            <p><br></p>
            <p>Thanks a lot,<br>Your Name Here</p>
        `,

        resume: `
            <h2 style="text-align: center;">Your Awesome Name</h2>
            <p style="text-align: center;">Your Address | Your Email | Your Phone</p>
            <h3>About Me</h3>
            <p>Write something cool about yourself here.</p>
            <h3>Work Stuff</h3>
            <p>Put your experience here.</p>
        `,

        notes: `
            <h2>Meeting Notes</h2>
            <p>Date: Put Date Here</p>
            <p>Who Came: List People Here</p>
            <p>Things talked about:<br>- Thing 1<br>- Thing 2</p>
        `,
    };
    if (template) {
        editor.innerHTML = templates[template];

        updateCounts();
        setTimeout(() => {
            editor.scrollTop = editor.scrollHeight - editor.clientHeight;
        }, 0);
    }
};

const exportToPDF = () => {
    const content = editor.innerHTML;
    const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Calibri, sans-serif; padding: 20px; }
                ${editor.style.cssText}
            </style>
        </head>
        <body>${content}</body>
        </html>
    `], { type: 'text/html' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'document.pdf';
    a.click();

    URL.revokeObjectURL(url);
};

const exportToDocx = () => {
    let content = editor.innerHTML;
    let zip = new JSZip();

    zip.file('[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>'
    );

    zip.file('_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>'
    );

    let step1 = content.replace(/<\/p>/g, '</w:t></w:r></w:p><w:p><w:r><w:t>');
    let step2 = step1.replace(/<p>/g, '<w:r><w:t>');

    let docXml = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '<w:body>' +
        '<w:p>' + step2 + '</w:t></w:r></w:p>' +
        '</w:body>' +
        '</w:document>';

    zip.file('word/document.xml', docXml);

    zip.generateAsync({ type: 'blob' }).then(blob => {
        saveAs(blob, 'document.docx');
    });
};

editor.addEventListener('input', () => {
    if (editor.innerHTML === '') editor.innerHTML = '<br>';

    updateCounts();
    setTimeout(() => {
        editor.scrollTop = editor.scrollHeight - editor.clientHeight;
    }, 0);
});

editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        setTimeout(() => {
            editor.scrollTop = editor.scrollHeight - editor.clientHeight;
        }, 0);
    }
});

const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) elem.requestFullscreen().catch(() => alert("error occured"));
    else document.exitFullscreen();
};

window.onload = () => {
    const savedContent = localStorage.getItem('wordpadContent');
    if (savedContent) {
        editor.innerHTML = savedContent;
        updateCounts();
        setTimeout(() => {
            editor.scrollTop = editor.scrollHeight - editor.clientHeight;
        }, 0);
    }
};

autoSave();
updateCounts();