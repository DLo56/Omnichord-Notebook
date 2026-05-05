document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const columns = ['Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B'];
    const rows = [
        { id: 'maj', label: 'Maj' },
        { id: 'min', label: 'Min' },
        { id: '7th', label: '7th' }
    ];

    const chordQualities = [
        { id: 'maj', label: 'Major', buttons: [{col:0, row:'maj'}] },
        { id: '7th', label: 'Dominant 7th', buttons: [{col:0, row:'7th'}] },
        { id: 'maj7', label: 'Major 7th', buttons: [{col:0, row:'maj'}, {col:0, row:'7th'}] },
        { id: 'min', label: 'Minor', buttons: [{col:0, row:'min'}] },
        { id: 'm7', label: 'Minor 7th', buttons: [{col:0, row:'min'}, {col:0, row:'7th'}] },
        { id: 'dim', label: 'Diminished', buttons: [{col:0, row:'maj'}, {col:0, row:'min'}] },
        { id: 'aug', label: 'Augmented', buttons: [{col:0, row:'maj'}, {col:0, row:'min'}, {col:0, row:'7th'}] },
        { id: 'sus4', label: 'Suspended 4th', buttons: [{col:0, row:'maj'}, {col:-1, row:'7th'}] },
        { id: 'add9', label: 'Major Add 9', buttons: [{col:0, row:'maj'}, {col:-1, row:'min'}] }
    ];

    const durations = [
        { label: 'Whole', symbol: '𝅝' },
        { label: 'Dotted Half + Eighth', symbol: '𝅗𝅥.‿𝅘𝅥𝅮' },
        { label: 'Dotted Half', symbol: '𝅗𝅥.' },
        { label: 'Half + Eighth', symbol: '𝅗𝅥‿𝅘𝅥𝅮' },
        { label: 'Half', symbol: '𝅗𝅥' },
        { label: 'Dotted Quarter', symbol: '𝅘𝅥.' },
        { label: 'Quarter', symbol: '𝅘𝅥' },
        { label: 'Dotted Eighth', symbol: '𝅘𝅥𝅮.' },
        { label: 'Eighth', symbol: '𝅘𝅥𝅮' }
    ];

    // --- DOM Elements ---
    const addPhraseBtn = document.getElementById('addPhraseBtn');
    const sheetContainer = document.getElementById('sheetContainer');
    const printBtn = document.getElementById('printBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const keyboardBtn = document.getElementById('keyboardBtn');
    
    let keyboardsVisible = localStorage.getItem('keyboardsVisible') === 'true';
    
    // --- Audio Context ---
    let audioContext = null;
    function getAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    // --- Initialization ---
    // Try to load saved data, otherwise add empty section
    const savedData = localStorage.getItem('omnichordSheet');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            loadSheetData(data);
        } catch (e) {
            console.error('Failed to load saved data:', e);
            addEmptySection();
        }
    } else {
        addEmptySection();
    }
    
    // Apply keyboard visibility state
    if (keyboardsVisible) {
        document.querySelectorAll('.mini-keyboard').forEach(kbd => {
            kbd.style.display = 'flex';
        });
        if (keyboardBtn) keyboardBtn.classList.add('active');
    }

    // --- Event Listeners ---
    // skewSlider.addEventListener('input', (e) => { ... }); // Removed

    // addChordBtn.addEventListener('click', () => addChordToSheet()); // Removed
    if(addPhraseBtn) addPhraseBtn.addEventListener('click', addEmptySection);

    if(printBtn) printBtn.addEventListener('click', () => {
        // Update print layout columns based on input
        // const count = chordsPerPhraseInput.value || 4;
        // sheetContainer.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
        window.print();
        // Reset after print (optional, but keeps UI clean)
        // sheetContainer.style.gridTemplateColumns = ''; 
    });
    
    if(saveBtn) saveBtn.addEventListener('click', saveToJSON);
    if(loadBtn) loadBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => loadFromJSON(e.target.files[0]);
        input.click();
    });
    
    if(keyboardBtn) keyboardBtn.addEventListener('click', () => {
        keyboardsVisible = !keyboardsVisible;
        localStorage.setItem('keyboardsVisible', keyboardsVisible);
        document.querySelectorAll('.mini-keyboard').forEach(kbd => {
            kbd.style.display = keyboardsVisible ? 'flex' : 'none';
        });
        if (keyboardsVisible) {
            keyboardBtn.classList.add('active');
        } else {
            keyboardBtn.classList.remove('active');
        }
    });
    
    // Auto-save to localStorage on changes
    function autoSave() {
        const data = collectSheetData();
        localStorage.setItem('omnichordSheet', JSON.stringify(data));
    }
    
    // Debounce auto-save to avoid excessive writes
    let autoSaveTimeout;
    function triggerAutoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(autoSave, 1000);
    }

    function createChordCard(container, isEmpty = false) {
        // If not empty and no name, don't add (unless it's an empty template request)
        // if (!isEmpty && !chordNameInput.value) return; // Removed dependency

        const card = document.createElement('div');
        card.className = 'sheet-chord-card';
        card.dataset.durSymbol = '𝅝'; // Default to Whole note
        
        const removeBtnWrapper = document.createElement('div');
        removeBtnWrapper.className = 'remove-chord-wrapper button-wrapper';
        
        const removeLabel = document.createElement('div');
        removeLabel.className = 'button-label';
        removeLabel.textContent = 'Remove';
        
        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-chord';
        removeBtn.onclick = () => {
            card.remove();
            triggerAutoSave();
        };
        
        removeBtnWrapper.appendChild(removeLabel);
        removeBtnWrapper.appendChild(removeBtn);

        // --- Root Note Selector (displays as chord name) ---
        const rootSelector = document.createElement('select');
        rootSelector.className = 'card-root-selector';
        const emptyRoot = document.createElement('option');
        emptyRoot.value = '';
        emptyRoot.text = '—';
        rootSelector.appendChild(emptyRoot);
        columns.forEach((col, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.text = col;
            rootSelector.appendChild(opt);
        });
        rootSelector.addEventListener('change', () => {
            card.dataset.rootIdx = rootSelector.value;
            // Default to major if no quality is set and a root is selected
            if (rootSelector.value !== '' && !card.dataset.qualId) {
                card.dataset.qualId = 'maj';
            }
            updateCardDisplay(card);
            triggerAutoSave();
        });
        
        // --- Mini Keyboard ---
        const miniKeyboard = document.createElement('div');
        miniKeyboard.className = 'mini-keyboard';
        miniKeyboard.style.display = keyboardsVisible ? 'flex' : 'none';
        
        // Piano keys from F to F (13 keys)
        // First F is for visual clarity only and never used
        // Store both sharp and flat names for matching
        const keyData = [
            { name: 'F', isBlack: false },
            { name: 'F#/Gb', isBlack: true },
            { name: 'G', isBlack: false },
            { name: 'G#/Ab', isBlack: true },
            { name: 'A', isBlack: false },
            { name: 'A#/Bb', isBlack: true },
            { name: 'B', isBlack: false },
            { name: 'C', isBlack: false },
            { name: 'C#/Db', isBlack: true },
            { name: 'D', isBlack: false },
            { name: 'D#/Eb', isBlack: true },
            { name: 'E', isBlack: false },
            { name: 'F', isBlack: false }
        ];
        
        keyData.forEach((keyInfo, idx) => {
            const key = document.createElement('div');
            key.className = keyInfo.isBlack ? 'piano-key black' : 'piano-key white';
            key.dataset.note = keyInfo.name;
            key.dataset.index = idx;
            miniKeyboard.appendChild(key);
        });
        
        card.keyboardElement = miniKeyboard;
        
        // --- Duration Selector ---
        const durationSelector = document.createElement('select');
        durationSelector.className = 'card-duration-selector';
        
        durations.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.symbol;
            opt.text = d.symbol;
            durationSelector.appendChild(opt);
        });
        durationSelector.addEventListener('change', () => {
            card.dataset.durSymbol = durationSelector.value;
            updateCardDisplay(card);
            triggerAutoSave();
        });

        // --- Mini Grid ---
        const miniGrid = document.createElement('div');
        miniGrid.className = 'mini-grid';

        // Store references to mini-buttons to update them later
        const miniButtons = [];
        
        // Track which buttons are active (for click-to-edit)
        const activeButtons = new Set();

        // Grid Buttons
        rows.forEach(row => {
            ['-1', '0'].forEach((relCol, colIndex) => {
                const btn = document.createElement('div');
                btn.className = 'mini-grid-button';
                btn.dataset.relCol = relCol;
                btn.dataset.rowId = row.id;
                
                // Hide Left Major as per requirement ("MINOR and 7th of the note to the left")
                if (relCol === '-1' && row.id === 'maj') {
                    btn.classList.add('hidden');
                }
                
                // Click handler for mini-grid buttons
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent drag start
                    const key = `${relCol}-${row.id}`;
                    
                    // Toggle button state
                    if (activeButtons.has(key)) {
                        activeButtons.delete(key);
                        btn.classList.remove('active');
                    } else {
                        activeButtons.add(key);
                        btn.classList.add('active');
                    }
                    
                    // Detect chord quality from active buttons
                    detectChordQualityFromButtons();
                    triggerAutoSave();
                });

                miniGrid.appendChild(btn);
                miniButtons.push(btn);
            });
        });
        
        // Function to detect chord quality from clicked buttons
        function detectChordQualityFromButtons() {
            // Convert active buttons to array of button definitions
            const activePattern = Array.from(activeButtons).map(key => {
                // Handle negative numbers correctly (e.g., "-1-7th")
                const lastDashIndex = key.lastIndexOf('-');
                const col = key.substring(0, lastDashIndex);
                const row = key.substring(lastDashIndex + 1);
                return { col: parseInt(col), row: row };
            });
            
            // Try to match pattern to a known quality
            let matchedQuality = null;
            
            for (const quality of chordQualities) {
                // Check if patterns match (same buttons)
                if (quality.buttons.length === activePattern.length) {
                    const allMatch = quality.buttons.every(qBtn => 
                        activePattern.some(aBtn => aBtn.col === qBtn.col && aBtn.row === qBtn.row)
                    );
                    
                    if (allMatch) {
                        matchedQuality = quality.id;
                        break;
                    }
                }
            }
            
            // Default to major if no match found and buttons are pressed
            if (!matchedQuality && activePattern.length > 0) {
                matchedQuality = 'maj';
            }
            
            // Update card dataset
            card.dataset.qualId = matchedQuality || '';
            
            // Update display
            updateCardDisplay(card);
        }

        // Store initial empty values
        card.dataset.rootIdx = '';
        card.dataset.qualId = '';
        card.dataset.durSymbol = '';
        
        // Create update function for this card
        function updateCardDisplay(cardElement) {
            const rootIdx = cardElement.dataset.rootIdx !== '' ? parseInt(cardElement.dataset.rootIdx) : null;
            const qualId = cardElement.dataset.qualId || null;
            const durSymbol = cardElement.dataset.durSymbol || null;
            
            // Update root selector to show full chord name
            if (rootIdx !== null && !isNaN(rootIdx)) {
                const rootName = columns[rootIdx];
                let suffix = '';
                
                if (qualId) {
                    switch(qualId) {
                        case 'maj': suffix = 'M'; break;
                        case 'min': suffix = 'm'; break;
                        case '7th': suffix = '7'; break;
                        case 'maj7': suffix = 'M7'; break;
                        case 'm7': suffix = 'm7'; break;
                        case 'dim': suffix = 'dim'; break;
                        case 'aug': suffix = 'aug'; break;
                        case 'sus4': suffix = 'sus4'; break;
                        case 'add9': suffix = 'add9'; break;
                    }
                } else {
                    suffix = 'M'; // Default to Major if no quality specified
                }
                
                // Rebuild options to show chord name
                rootSelector.innerHTML = '';
                const emptyOpt = document.createElement('option');
                emptyOpt.value = '';
                emptyOpt.text = '—';
                rootSelector.appendChild(emptyOpt);
                columns.forEach((col, idx) => {
                    const opt = document.createElement('option');
                    opt.value = idx;
                    opt.text = col;
                    if (idx === rootIdx) {
                        opt.text = rootName + suffix;
                    }
                    rootSelector.appendChild(opt);
                });
                rootSelector.value = String(rootIdx);
            } else {
                rootSelector.value = '';
            }
            
            // Sync duration selector
            durationSelector.value = durSymbol || '';
            
            // Clear all mini buttons and activeButtons set
            activeButtons.clear();
            miniButtons.forEach(b => {
                b.classList.remove('active');
            });
            
            // Highlight mini-grid buttons based on quality
            if (qualId) {
                const quality = chordQualities.find(q => q.id === qualId);
                if (quality) {
                    quality.buttons.forEach(offset => {
                        const targetBtn = miniButtons.find(b => 
                            b.dataset.relCol === String(offset.col) && 
                            b.dataset.rowId === offset.row
                        );
                        
                        if (targetBtn) {
                            targetBtn.classList.add('active');
                            // Sync activeButtons set
                            activeButtons.add(`${offset.col}-${offset.row}`);
                        }
                    });
                }
            }            
            // Update keyboard display
            updateKeyboard(cardElement, rootIdx, qualId);
        }
        
        // Function to calculate chord notes and highlight keyboard
        function updateKeyboard(cardElement, rootIdx, qualId) {
            if (!cardElement.keyboardElement) return;
            
            // Clear all highlights
            cardElement.keyboardElement.querySelectorAll('.piano-key').forEach(k => {
                k.classList.remove('active');
            });
            
            if (rootIdx === null || rootIdx === undefined || rootIdx === '' || !qualId) return;
            
            const rootNote = columns[parseInt(rootIdx)];
            
            // Map of all note names to their position in chromatic scale
            // Position 0 is visual only, actual range is 1-12 (F# to upper F)
            const notePositions = {
                'F#': 1, 'Gb': 1,
                'G': 2,
                'G#': 3, 'Ab': 3,
                'A': 4,
                'A#': 5, 'Bb': 5,
                'B': 6,
                'C': 7,
                'C#': 8, 'Db': 8,
                'D': 9,
                'D#': 10, 'Eb': 10,
                'E': 11,
                'F': 12
            };
            
            const rootPosition = notePositions[rootNote];
            
            if (rootPosition === undefined) return;
            
            // Calculate intervals for each chord type (3 notes only)
            let intervals = [];
            switch(qualId) {
                case 'maj':
                    intervals = [0, 4, 7]; // Root, Major 3rd, Perfect 5th
                    break;
                case 'min':
                    intervals = [0, 3, 7]; // Root, Minor 3rd, Perfect 5th
                    break;
                case '7th':
                    intervals = [0, 4, 10]; // Root, Major 3rd, Minor 7th (no 5th)
                    break;
                case 'maj7':
                    intervals = [0, 4, 11]; // Root, Major 3rd, Major 7th
                    break;
                case 'm7':
                    intervals = [0, 3, 10]; // Root, Minor 3rd, Minor 7th
                    break;
                case 'dim':
                    intervals = [0, 3, 6]; // Root, Minor 3rd, Diminished 5th
                    break;
                case 'aug':
                    intervals = [0, 4, 8]; // Root, Major 3rd, Augmented 5th
                    break;
                case 'sus4':
                    intervals = [0, 5, 7]; // Root, Perfect 4th, Perfect 5th
                    break;
                case 'add9':
                    intervals = [0, 2, 7]; // Root, Major 2nd (9th), Perfect 5th (no 3rd)
                    break;
            }
            
            // Highlight the notes
            intervals.forEach(interval => {
                // Calculate position (1-12 range wrapping to stay in bounds)
                let notePos = rootPosition + interval;
                // Wrap around if needed, keeping in 1-12 range
                while (notePos > 12) notePos -= 12;
                while (notePos < 1) notePos += 12;
                
                // Find key with this position
                const key = cardElement.keyboardElement.querySelector(`[data-index="${notePos}"]`);
                if (key) {
                    key.classList.add('active');
                }
            });
        }
        
        // Make update function accessible
        card.updateDisplay = () => updateCardDisplay(card);

        // --- Pre-fill if not empty ---
        /*
        if (!isEmpty) {
            rows.forEach(row => {
                columns.forEach((colName, colIndex) => {
                    const key = `${colIndex}-${row.id}`;
                    if (selectedButtons.has(key)) {
                        const btn = miniButtons.find(b => b.dataset.colIndex == colIndex && b.dataset.rowId == row.id);
                        if(btn) {
                            btn.style.backgroundColor = '#333';
                            btn.style.borderColor = '#000';
                        }
                    }
                });
            });
        }
        */

        const lyrics = document.createElement('textarea');
        // lyrics.className = 'sheet-lyrics'; // Removed
        // lyrics.placeholder = 'Lyrics/Notes...'; // Removed

        card.appendChild(removeBtnWrapper);
        card.appendChild(rootSelector);
        card.appendChild(miniKeyboard);
        card.appendChild(miniGrid);
        card.appendChild(durationSelector);

        container.appendChild(card);
        return card;
    }

    function addEmptySection() {
        // Create a new section
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'section-container';
        
        // Section Header (Title + Remove)
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        
        const sectionTitle = document.createElement('input');
        sectionTitle.type = 'text';
        sectionTitle.className = 'section-title';
        sectionTitle.placeholder = 'Section Title (e.g., Verse, Chorus)';
        sectionTitle.value = 'Section ' + (document.querySelectorAll('.section-container').length + 1);
        
        const collapseBtnWrapper = document.createElement('div');
        collapseBtnWrapper.className = 'button-wrapper';
        
        const collapseLabel = document.createElement('div');
        collapseLabel.className = 'button-label';
        collapseLabel.textContent = 'Collapse';
        
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'collapse-section-btn';
        collapseBtn.title = 'Collapse/Expand Section';
        collapseBtn.onclick = () => {
            const isCollapsed = sectionContainer.classList.toggle('collapsed');
            collapseLabel.textContent = isCollapsed ? 'Expand' : 'Collapse';
        };
        
        collapseBtnWrapper.appendChild(collapseLabel);
        collapseBtnWrapper.appendChild(collapseBtn);
        
        const removeBtnWrapper = document.createElement('div');
        removeBtnWrapper.className = 'button-wrapper';
        
        const removeLabel = document.createElement('div');
        removeLabel.className = 'button-label';
        removeLabel.textContent = 'Remove';
        
        const removeSectionBtn = document.createElement('button');
        removeSectionBtn.className = 'remove-section-btn';
        removeSectionBtn.title = 'Remove Section';
        removeSectionBtn.onclick = () => {
            if(confirm('Remove this entire section and all its phrases?')) sectionContainer.remove();
        };
        
        removeBtnWrapper.appendChild(removeLabel);
        removeBtnWrapper.appendChild(removeSectionBtn);

        sectionHeader.appendChild(sectionTitle);
        sectionHeader.appendChild(collapseBtnWrapper);
        sectionHeader.appendChild(removeBtnWrapper);
        sectionContainer.appendChild(sectionHeader);
        
        // Section Controls (Voice, Pattern, Tempo)
        const sectionControls = document.createElement('div');
        sectionControls.className = 'section-controls';
        
        // Voice selector
        const voiceGroup = document.createElement('div');
        voiceGroup.className = 'section-control-group';
        const voiceLabel = document.createElement('label');
        voiceLabel.textContent = 'Voice:';
        const voiceSelect = document.createElement('select');
        voiceSelect.className = 'section-control-select';
        const voices = ['Omni 1', 'Omni 2', 'Harp', 'Celeste', 'A. Piano', 'Guitar', 'FM Piano', 'Organ', 'Vibes', 'Banjo'];
        voices.forEach(voice => {
            const opt = document.createElement('option');
            opt.value = voice;
            opt.text = voice;
            voiceSelect.appendChild(opt);
        });
        voiceGroup.appendChild(voiceLabel);
        voiceGroup.appendChild(voiceSelect);
        
        // Pattern selector
        const patternGroup = document.createElement('div');
        patternGroup.className = 'section-control-group';
        const patternLabel = document.createElement('label');
        patternLabel.textContent = 'Pattern:';
        const patternSelect = document.createElement('select');
        patternSelect.className = 'section-control-select';
        const patterns = ['Rock 1', 'Rock 2', 'Slow Rock', 'Country', 'Swing', 'Disco', 'Hip Hop', 'Funk', 'Bossanova', 'Waltz'];
        patterns.forEach(pattern => {
            const opt = document.createElement('option');
            opt.value = pattern;
            opt.text = pattern;
            patternSelect.appendChild(opt);
        });
        patternGroup.appendChild(patternLabel);
        patternGroup.appendChild(patternSelect);
        
        // Tempo input
        const tempoGroup = document.createElement('div');
        tempoGroup.className = 'section-control-group';
        const tempoLabel = document.createElement('label');
        tempoLabel.textContent = 'Tempo:';
        const tempoInput = document.createElement('input');
        tempoInput.type = 'number';
        tempoInput.className = 'section-control-input';
        tempoInput.placeholder = 'BPM';
        tempoInput.min = '40';
        tempoInput.max = '240';
        tempoInput.value = '120';
        tempoGroup.appendChild(tempoLabel);
        tempoGroup.appendChild(tempoInput);
        
        sectionControls.appendChild(voiceGroup);
        sectionControls.appendChild(patternGroup);
        sectionControls.appendChild(tempoGroup);
        sectionContainer.appendChild(sectionControls);
        
        // Phrases Container for this section
        const phrasesContainer = document.createElement('div');
        phrasesContainer.className = 'section-phrases-container';
        sectionContainer.appendChild(phrasesContainer);
        
        // Add one phrase by default
        addEmptyPhrase(phrasesContainer);
        
        // Add inline "add phrase" button
        const addPhraseCard = document.createElement('div');
        addPhraseCard.className = 'add-phrase-card';
        addPhraseCard.title = 'Add Phrase';
        addPhraseCard.textContent = '+ Phrase';
        addPhraseCard.onclick = () => {
            // Insert before the add button
            phrasesContainer.insertBefore(
                addEmptyPhrase(phrasesContainer),
                addPhraseCard
            );
        };
        phrasesContainer.appendChild(addPhraseCard);
        
        sheetContainer.appendChild(sectionContainer);
        return sectionContainer;
    }

    function addEmptyPhrase(container) {
        const count = 1; // Default to 1 chord per phrase
        
        // Create a new phrase section
        const phraseSection = document.createElement('div');
        phraseSection.className = 'phrase-section';
        
        // Phrase Header (Title + Remove)
        const phraseHeader = document.createElement('div');
        phraseHeader.className = 'phrase-header';
        
        const phraseTitle = document.createElement('input');
        phraseTitle.type = 'text';
        phraseTitle.className = 'phrase-title';
        phraseTitle.placeholder = 'Phrase Title (e.g., Verse 1)';
        phraseTitle.value = 'Phrase ' + (container.querySelectorAll('.phrase-section').length + 1);
        
        const playBtnWrapper = document.createElement('div');
        playBtnWrapper.className = 'button-wrapper';
        
        const playLabel = document.createElement('div');
        playLabel.className = 'button-label';
        playLabel.textContent = 'Play';
        
        const playPhraseBtn = document.createElement('button');
        playPhraseBtn.className = 'play-phrase-btn';
        playPhraseBtn.title = 'Play Phrase';
        playPhraseBtn.onclick = () => playPhrase(phraseSection);
        
        playBtnWrapper.appendChild(playLabel);
        playBtnWrapper.appendChild(playPhraseBtn);
        
        const collapseBtnWrapper = document.createElement('div');
        collapseBtnWrapper.className = 'button-wrapper';
        
        const collapseLabel = document.createElement('div');
        collapseLabel.className = 'button-label';
        collapseLabel.textContent = 'Collapse';
        
        const collapsePhraseBtn = document.createElement('button');
        collapsePhraseBtn.className = 'collapse-phrase-btn';
        collapsePhraseBtn.title = 'Collapse/Expand Phrase';
        collapsePhraseBtn.onclick = () => {
            const isCollapsed = phraseSection.classList.toggle('collapsed');
            collapseLabel.textContent = isCollapsed ? 'Expand' : 'Collapse';
        };
        
        collapseBtnWrapper.appendChild(collapseLabel);
        collapseBtnWrapper.appendChild(collapsePhraseBtn);
        
        const removeBtnWrapper = document.createElement('div');
        removeBtnWrapper.className = 'button-wrapper';
        
        const removeLabel = document.createElement('div');
        removeLabel.className = 'button-label';
        removeLabel.textContent = 'Remove';
        
        const removePhraseBtn = document.createElement('button');
        removePhraseBtn.className = 'remove-phrase-btn';
        removePhraseBtn.title = 'Remove Phrase';
        removePhraseBtn.onclick = () => {
            if(confirm('Remove this entire phrase?')) phraseSection.remove();
        };
        
        removeBtnWrapper.appendChild(removeLabel);
        removeBtnWrapper.appendChild(removePhraseBtn);

        phraseHeader.appendChild(phraseTitle);
        phraseHeader.appendChild(playBtnWrapper);
        phraseHeader.appendChild(collapseBtnWrapper);
        phraseHeader.appendChild(removeBtnWrapper);
        phraseSection.appendChild(phraseHeader);
        
        // Chords Container for this phrase
        const chordsContainer = document.createElement('div');
        chordsContainer.className = 'phrase-chords-container';
        
        phraseSection.appendChild(chordsContainer);
        container.appendChild(phraseSection);

        for(let i=0; i<count; i++) {
            createChordCard(chordsContainer, true);
        }

        // Add inline "add chord" button
        const addChordCard = document.createElement('div');
        addChordCard.className = 'add-chord-card';
        addChordCard.title = 'Add Chord';
        addChordCard.innerHTML = '<span>+</span>';
        addChordCard.onclick = () => {
            // Insert before the add button
            chordsContainer.insertBefore(
                createChordCard(chordsContainer, true),
                addChordCard
            );  
        };
        chordsContainer.appendChild(addChordCard);
        
        return phraseSection;
    }
    
    // --- Audio Playback ---
    function playPhrase(phraseSection) {
        const cards = phraseSection.querySelectorAll('.sheet-chord-card');
        let currentTime = 0;
        const ctx = getAudioContext();
        
        // Get tempo from parent section
        const sectionContainer = phraseSection.closest('.section-container');
        const tempoInput = sectionContainer?.querySelector('.section-control-input');
        const tempo = tempoInput ? parseInt(tempoInput.value) || 120 : 120;
        
        cards.forEach(card => {
            const rootIdx = card.dataset.rootIdx;
            const qualId = card.dataset.qualId;
            const durSymbol = card.dataset.durSymbol;
            
            if (!rootIdx || !qualId) return;
            
            // Get chord notes
            const notes = getChordNotes(parseInt(rootIdx), qualId);
            if (notes.length === 0) return;
            
            // Get duration in seconds
            const duration = getDurationInSeconds(durSymbol, tempo);
            
            // Play chord at scheduled time
            playChord(ctx, notes, currentTime, duration);
            currentTime += duration;
        });
    }
    
    function getChordNotes(rootIdx, qualId) {
        const rootNote = columns[rootIdx];
        
        // Map of all note names to their position in chromatic scale
        const notePositions = {
            'F#': 1, 'Gb': 1,
            'G': 2,
            'G#': 3, 'Ab': 3,
            'A': 4,
            'A#': 5, 'Bb': 5,
            'B': 6,
            'C': 7,
            'C#': 8, 'Db': 8,
            'D': 9,
            'D#': 10, 'Eb': 10,
            'E': 11,
            'F': 12
        };
        
        const rootPosition = notePositions[rootNote];
        if (rootPosition === undefined) return [];
        
        // Calculate intervals for each chord type (3 notes only)
        let intervals = [];
        switch(qualId) {
            case 'maj':
                intervals = [0, 4, 7];
                break;
            case 'min':
                intervals = [0, 3, 7];
                break;
            case '7th':
                intervals = [0, 4, 10];
                break;
            case 'maj7':
                intervals = [0, 4, 11];
                break;
            case 'm7':
                intervals = [0, 3, 10];
                break;
            case 'dim':
                intervals = [0, 3, 6];
                break;
            case 'aug':
                intervals = [0, 4, 8];
                break;
            case 'sus4':
                intervals = [0, 5, 7];
                break;
            case 'add9':
                intervals = [0, 2, 7];
                break;
        }
        
        // Convert to frequencies (F#3 = 185Hz as base)
        const baseFreq = 185; // F#3
        const notes = intervals.map(interval => {
            let notePos = rootPosition + interval;
            while (notePos > 12) notePos -= 12;
            while (notePos < 1) notePos += 12;
            
            // Calculate semitones from F#3
            const semitones = notePos - 1;
            return baseFreq * Math.pow(2, semitones / 12);
        });
        
        return notes;
    }
    
    function getDurationInSeconds(durSymbol, tempo = 120) {
        // Calculate quarter note duration based on BPM
        const quarterNote = 60 / tempo;
        
        switch(durSymbol) {
            case '𝅝': return quarterNote * 4; // Whole
            case '�.‿𝅘𝅥𝅮': return quarterNote * 3.5; // Dotted Half + Eighth
            case '𝅗𝅥.': return quarterNote * 3; // Dotted Half
            case '𝅗𝅥‿𝅘𝅥𝅮': return quarterNote * 2.5; // Half + Eighth
            case '𝅗𝅥': return quarterNote * 2; // Half
            case '𝅘𝅥.': return quarterNote * 1.5; // Dotted Quarter
            case '𝅘𝅥': return quarterNote; // Quarter
            case '𝅘𝅥𝅮.': return quarterNote * 0.75; // Dotted Eighth
            case '𝅘𝅥𝅮': return quarterNote * 0.5; // Eighth
            default: return quarterNote; // Default to quarter note
        }
    }
    
    function playChord(ctx, frequencies, startTime, duration) {
        const now = ctx.currentTime;
        const attackTime = 0.01;
        const releaseTime = 0.1;
        
        frequencies.forEach(freq => {
            // Create oscillator for each note
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            // Envelope
            gainNode.gain.setValueAtTime(0, now + startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, now + startTime + attackTime);
            gainNode.gain.setValueAtTime(0.2, now + startTime + duration - releaseTime);
            gainNode.gain.linearRampToValueAtTime(0, now + startTime + duration);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.start(now + startTime);
            osc.stop(now + startTime + duration);
        });
    }

    function collectSheetData() {
        const data = {
            sections: []
        };
        
        document.querySelectorAll('.section-container').forEach(section => {
            const sectionData = {
                title: section.querySelector('.section-title').value,
                voice: section.querySelectorAll('.section-control-select')[0]?.value || '',
                pattern: section.querySelectorAll('.section-control-select')[1]?.value || '',
                tempo: section.querySelector('.section-control-input').value,
                phrases: []
            };
            
            section.querySelectorAll('.phrase-section').forEach(phrase => {
                const phraseData = {
                    title: phrase.querySelector('.phrase-title').value,
                    chords: []
                };
                
                phrase.querySelectorAll('.sheet-chord-card').forEach(card => {
                    phraseData.chords.push({
                        rootIdx: card.dataset.rootIdx || '',
                        quality: card.dataset.qualId || '',
                        duration: card.dataset.durSymbol || ''
                    });
                });
                
                sectionData.phrases.push(phraseData);
            });
            
            data.sections.push(sectionData);
        });
        
        return data;
    }
    
    function saveToJSON() {
        const data = collectSheetData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'omnichord-sheet.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    function loadSheetData(data) {
        // Clear existing content
        sheetContainer.innerHTML = '';
                
                data.sections.forEach(sectionData => {
                    const section = addEmptySection();
                    section.querySelector('.section-title').value = sectionData.title;
                    
                    const selects = section.querySelectorAll('.section-control-select');
                    if (selects[0]) selects[0].value = sectionData.voice;
                    if (selects[1]) selects[1].value = sectionData.pattern;
                    section.querySelector('.section-control-input').value = sectionData.tempo;
                    
                    // Remove default phrase
                    const defaultPhrase = section.querySelector('.phrase-section');
                    if (defaultPhrase) defaultPhrase.remove();
                    
                    const phrasesContainer = section.querySelector('.section-phrases-container');
                    const addPhraseCard = phrasesContainer.querySelector('.add-phrase-card');
                    
                    sectionData.phrases.forEach(phraseData => {
                        const phrase = addEmptyPhrase(phrasesContainer);
                        phrasesContainer.insertBefore(phrase, addPhraseCard);
                        phrase.querySelector('.phrase-title').value = phraseData.title;
                        
                        // Remove default chord
                        const defaultChord = phrase.querySelector('.sheet-chord-card');
                        if (defaultChord) defaultChord.remove();
                        
                        const chordsContainer = phrase.querySelector('.phrase-chords-container');
                        const addChordCard = chordsContainer.querySelector('.add-chord-card');
                        
                        phraseData.chords.forEach(chordData => {
                            const card = createChordCard(chordsContainer, true);
                            chordsContainer.insertBefore(card, addChordCard);
                            
                            card.dataset.rootIdx = chordData.rootIdx;
                            card.dataset.qualId = chordData.quality;
                            card.dataset.durSymbol = chordData.duration;
                            
                            if (card.updateDisplay) {
                                card.updateDisplay();
                            }
                        });
                    });
                });    }
    
    function loadFromJSON(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                loadSheetData(data);
                triggerAutoSave();            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // --- Tab Switching ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });

    // --- Circle of Fifths Visualization ---
    let sharedSelectedRoot = 'C';
    let sharedSelectedMode = 'maj';
    
    function initializeCircleOfFifths() {
        const svg = document.getElementById('circleOfFifths');
        const outerRadiusOuter = 170;
        const outerRadiusInner = 110;
        const innerRadiusOuter = 110;
        const innerRadiusInner = 50;
        const circleOfFifthsOrder = ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
        const relativeMinors = ['A', 'E', 'B', 'F#', 'C#', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D'];
        
        // Get interval colors from CSS variables
        const rootStyle = getComputedStyle(document.documentElement);
        const intervalColors = {
            'root': rootStyle.getPropertyValue('--interval-root').trim(),
            'major': rootStyle.getPropertyValue('--interval-major').trim(),
            'minor': rootStyle.getPropertyValue('--interval-minor').trim(),
            'perfect': rootStyle.getPropertyValue('--interval-perfect').trim(),
            'tritone': rootStyle.getPropertyValue('--interval-tritone').trim(),
            'wholestep': rootStyle.getPropertyValue('--interval-wholestep').trim(),
            'default': '#ccc'
        };
        
        // Helper function to create wedge path
        function createWedgePath(startAngle, endAngle, innerRadius, outerRadius) {
            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);
            
            const x1 = Math.cos(startAngleRad) * outerRadius;
            const y1 = Math.sin(startAngleRad) * outerRadius;
            const x2 = Math.cos(endAngleRad) * outerRadius;
            const y2 = Math.sin(endAngleRad) * outerRadius;
            const x3 = Math.cos(endAngleRad) * innerRadius;
            const y3 = Math.sin(endAngleRad) * innerRadius;
            const x4 = Math.cos(startAngleRad) * innerRadius;
            const y4 = Math.sin(startAngleRad) * innerRadius;
            
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            
            return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
        }
        
        // Create outer wedges (Major keys)
        circleOfFifthsOrder.forEach((note, index) => {
            const startAngle = index * 30;
            const endAngle = (index + 1) * 30;
            const midAngle = (startAngle + endAngle) / 2;
            const midAngleRad = (midAngle - 90) * (Math.PI / 180);
            
            const labelRadius = (outerRadiusOuter + outerRadiusInner) / 2;
            const labelX = Math.cos(midAngleRad) * labelRadius;
            const labelY = Math.sin(midAngleRad) * labelRadius;
            
            const noteLabelRadius = outerRadiusOuter + 25;
            const noteLabelX = Math.cos(midAngleRad) * noteLabelRadius;
            const noteLabelY = Math.sin(midAngleRad) * noteLabelRadius;
            
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.classList.add('circle-note', 'major-key');
            group.dataset.note = note;
            group.dataset.mode = 'maj';
            
            const wedge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            wedge.setAttribute('d', createWedgePath(startAngle, endAngle, outerRadiusInner, outerRadiusOuter));
            wedge.classList.add('note-wedge');
            wedge.setAttribute('fill', intervalColors.default);
            wedge.setAttribute('stroke', '#333');
            wedge.setAttribute('stroke-width', '2');
            
            const intervalLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            intervalLabel.setAttribute('x', labelX);
            intervalLabel.setAttribute('y', labelY);
            intervalLabel.classList.add('interval-text');
            intervalLabel.style.fontSize = '18px';
            intervalLabel.style.fontWeight = 'bold';
            intervalLabel.setAttribute('text-anchor', 'middle');
            intervalLabel.setAttribute('dominant-baseline', 'middle');
            intervalLabel.style.pointerEvents = 'none';
            intervalLabel.style.fill = 'white';
            
            // Note name label outside wedge
            const noteLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            noteLabel.setAttribute('x', noteLabelX);
            noteLabel.setAttribute('y', noteLabelY);
            noteLabel.classList.add('note-text');
            noteLabel.textContent = note;
            noteLabel.setAttribute('text-anchor', 'middle');
            noteLabel.setAttribute('dominant-baseline', 'middle');
            noteLabel.style.fill = 'var(--primary-blue)';
            noteLabel.style.fontSize = '16px';
            noteLabel.style.fontWeight = 'bold';
            noteLabel.style.pointerEvents = 'none';
            
            group.appendChild(wedge);
            group.appendChild(intervalLabel);
            group.appendChild(noteLabel);
            svg.appendChild(group);
            
            group.addEventListener('click', () => {
                sharedSelectedRoot = note;
                sharedSelectedMode = 'maj';
                updateCircleOfFifths();
                updateOmnichordGridFromCircle();
            });
            
            group.style.cursor = 'pointer';
        });
        
        // Create inner wedges (Minor keys)
        relativeMinors.forEach((note, index) => {
            const startAngle = index * 30;
            const endAngle = (index + 1) * 30;
            const midAngle = (startAngle + endAngle) / 2;
            const midAngleRad = (midAngle - 90) * (Math.PI / 180);
            
            const labelRadius = (innerRadiusOuter + innerRadiusInner) / 2;
            const labelX = Math.cos(midAngleRad) * labelRadius;
            const labelY = Math.sin(midAngleRad) * labelRadius;
            
            // Normalize note name to match columns array
            let normalizedNote = note;
            if (note === 'F#') normalizedNote = 'Gb';
            if (note === 'C#') normalizedNote = 'Db';
            
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.classList.add('circle-note', 'minor-key');
            group.dataset.note = normalizedNote;
            group.dataset.mode = 'min';
            
            const wedge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            wedge.setAttribute('d', createWedgePath(startAngle, endAngle, innerRadiusInner, innerRadiusOuter));
            wedge.classList.add('note-wedge');
            wedge.setAttribute('fill', intervalColors.default);
            wedge.setAttribute('stroke', '#333');
            wedge.setAttribute('stroke-width', '2');
            
            const intervalLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            intervalLabel.setAttribute('x', labelX);
            intervalLabel.setAttribute('y', labelY);
            intervalLabel.classList.add('interval-text');
            intervalLabel.style.fontSize = '14px';
            intervalLabel.style.fontWeight = 'bold';
            intervalLabel.setAttribute('text-anchor', 'middle');
            intervalLabel.setAttribute('dominant-baseline', 'middle');
            intervalLabel.style.pointerEvents = 'none';
            intervalLabel.style.fill = 'white';
            
            group.appendChild(wedge);
            group.appendChild(intervalLabel);
            svg.appendChild(group);
            
            group.addEventListener('click', () => {
                sharedSelectedRoot = normalizedNote;
                sharedSelectedMode = 'min';
                updateCircleOfFifths();
                updateOmnichordGridFromCircle();
            });
            
            group.style.cursor = 'pointer';
        });
        
        function updateCircleOfFifths() {
            const rootColIndex = columns.indexOf(sharedSelectedRoot);
            if (rootColIndex === -1) return;
            
            // Find the relative major/minor for highlighting
            let relativeMajor = null;
            let relativeMinor = null;
            
            if (sharedSelectedMode === 'maj') {
                // Find relative minor (same index in the arrays)
                const majorIndex = circleOfFifthsOrder.indexOf(sharedSelectedRoot);
                if (majorIndex !== -1) {
                    const relativeMinorNote = relativeMinors[majorIndex];
                    // Normalize to match columns array
                    relativeMinor = relativeMinorNote === 'F#' ? 'Gb' : 
                                   relativeMinorNote === 'C#' ? 'Db' : 
                                   relativeMinorNote;
                }
            } else {
                // Find relative major (same index in the arrays)
                const minorIndex = relativeMinors.findIndex(m => {
                    const normalized = m === 'F#' ? 'Gb' : m === 'C#' ? 'Db' : m;
                    return normalized === sharedSelectedRoot;
                });
                if (minorIndex !== -1) {
                    relativeMajor = circleOfFifthsOrder[minorIndex];
                }
            }
            
            // Get interval info from grid configuration
            const columnIntervals = [
                { offset: 0, type: 'root', label: '1', labelInMinor: '1', inMajor: true, inMinor: true },
                { offset: 1, type: 'perfect', label: '5', labelInMinor: '5', inMajor: true, inMinor: true },
                { offset: 2, type: 'wholestep', label: '2', labelInMinor: '2', inMajor: true, inMinor: true },
                { offset: 3, type: 'major', label: '6', labelInMinor: '#6', inMajor: true, inMinor: false },
                { offset: 4, type: 'major', label: '3', labelInMinor: 'b3', inMajor: true, inMinor: false },
                { offset: 5, type: 'major', label: '7', labelInMinor: '#7', inMajor: true, inMinor: false },
                { offset: 6, type: 'tritone', label: 'b5/#4', labelInMinor: 'b5/#4', inMajor: false, inMinor: false },
                { offset: 7, type: 'minor', label: 'b2', labelInMinor: 'b2', inMajor: false, inMinor: false },
                { offset: 8, type: 'minor', label: 'b6', labelInMinor: '6', inMajor: false, inMinor: true },
                { offset: 9, type: 'minor', label: 'b3', labelInMinor: '3', inMajor: false, inMinor: true },
                { offset: 10, type: 'wholestep', label: 'b7', labelInMinor: '7', inMajor: false, inMinor: true },
                { offset: 11, type: 'perfect', label: '4', labelInMinor: '4', inMajor: true, inMinor: true }
            ];
            
            // Update all circles
            svg.querySelectorAll('.circle-note').forEach(group => {
                const note = group.dataset.note;
                const mode = group.dataset.mode;
                
                // Determine reference root for interval calculation
                let offset;
                let referenceRootIndex;
                
                if (sharedSelectedMode === 'maj') {
                    // Major selected: major circles relative to major root, minor circles relative to relative minor
                    if (mode === 'min' && relativeMinor) {
                        referenceRootIndex = columns.indexOf(relativeMinor);
                    } else {
                        referenceRootIndex = rootColIndex;
                    }
                } else {
                    // Minor selected: minor circles relative to minor root, major circles relative to relative major
                    if (mode === 'maj' && relativeMajor) {
                        referenceRootIndex = columns.indexOf(relativeMajor);
                    } else {
                        referenceRootIndex = rootColIndex;
                    }
                }
                
                const colIndex = columns.indexOf(note);
                offset = colIndex - referenceRootIndex;
                if (offset < 0) offset += columns.length;
                
                const intervalInfo = columnIntervals.find(i => i.offset === offset);
                const wedge = group.querySelector('.note-wedge');
                const intervalLabel = group.querySelector('.interval-text');
                
                // Highlight if this is the selected root OR its relative
                const isSelected = (note === sharedSelectedRoot && mode === sharedSelectedMode);
                const isRelative = (mode === 'maj' && note === relativeMajor) || 
                                  (mode === 'min' && note === relativeMinor);
                
                if (isSelected || isRelative) {
                    wedge.setAttribute('stroke', '#000');
                    wedge.setAttribute('stroke-width', '4');
                } else {
                    wedge.setAttribute('stroke', '#333');
                    wedge.setAttribute('stroke-width', '2');
                }
                
                // Apply interval colors to both major and minor circles
                if (intervalInfo) {
                    // Dim if not in the selected scale
                    // Major circles always show major scale of their reference root
                    // Minor circles always show minor scale of their reference root
                    let inScale;
                    if (mode === 'maj') {
                        // Major circle: show major scale
                        inScale = intervalInfo.inMajor;
                    } else {
                        // Minor circle: show minor scale
                        inScale = intervalInfo.inMinor;
                    }
                    
                    // Set color: light gray for out of scale, interval color for in scale
                    if (!inScale) {
                        // Keep tritone as dimmed purple
                        if (intervalInfo.type === 'tritone') {
                            wedge.setAttribute('fill', intervalColors.tritone);
                            wedge.style.opacity = '0.5';
                        } else {
                            wedge.setAttribute('fill', '#ddd');
                            wedge.style.opacity = '1';
                        }
                    } else {
                        wedge.setAttribute('fill', intervalColors[intervalInfo.type] || intervalColors.default);
                        // Dim relative scale ring
                        const isRelativeRing = (sharedSelectedMode === 'maj' && mode === 'min') ||
                                              (sharedSelectedMode === 'min' && mode === 'maj');
                        wedge.style.opacity = isRelativeRing ? '0.6' : '1';
                    }
                    
                    // Show interval labels in both major and minor circles
                    if (intervalLabel) {
                        const label = (mode === 'min') ? intervalInfo.labelInMinor : intervalInfo.label;
                        intervalLabel.textContent = label;
                    }
                } else {
                    wedge.setAttribute('fill', '#ddd');
                    wedge.style.opacity = '1';
                    if (intervalLabel) intervalLabel.textContent = '';
                }
            });
        }
        
        function updateOmnichordGridFromCircle() {
            // Trigger grid update by simulating a click
            const gridButton = document.querySelector(
                `.grid-button[data-note="${sharedSelectedRoot}"][data-row="${sharedSelectedMode}"]`
            );
            if (gridButton) {
                gridButton.click();
            }
        }
        
        window.updateCircleOfFifthsFromGrid = updateCircleOfFifths;
        updateCircleOfFifths();
    }
    
    initializeCircleOfFifths();

    // --- Omnichord Grid Setup ---
    function initializeOmnichordGrid() {
        // Use shared state with circle of fifths
        if (typeof sharedSelectedRoot === 'undefined') {
            sharedSelectedRoot = 'C';
            sharedSelectedMode = 'maj';
        }
        
        // Column offset intervals (relative to root)
        // chordQualityInMajor/Minor: 'maj', 'min', 'dim', or null if not in scale
        const columnIntervals = [
            { offset: 0, type: 'root', label: '1', labelInMinor: '1', inMajor: true, inMinor: true, chordQualityInMajor: 'maj', chordQualityInMinor: 'min' },
            { offset: 1, type: 'perfect', label: '5', labelInMinor: '5', inMajor: true, inMinor: true, chordQualityInMajor: 'maj', chordQualityInMinor: 'min' },
            { offset: 2, type: 'wholestep', label: '2', labelInMinor: '2', inMajor: true, inMinor: true, chordQualityInMajor: 'min', chordQualityInMinor: 'dim' },
            { offset: 3, type: 'major', label: '6', labelInMinor: '#6', inMajor: true, inMinor: false, chordQualityInMajor: 'min', chordQualityInMinor: null },
            { offset: 4, type: 'major', label: '3', labelInMinor: 'b3', inMajor: true, inMinor: false, chordQualityInMajor: 'min', chordQualityInMinor: null },
            { offset: 5, type: 'major', label: '7', labelInMinor: '#7', inMajor: true, inMinor: false, chordQualityInMajor: 'dim', chordQualityInMinor: null },
            { offset: 6, type: 'tritone', label: 'b5/#4', labelInMinor: 'b5/#4', inMajor: false, inMinor: false, chordQualityInMajor: null, chordQualityInMinor: null },
            { offset: 7, type: 'minor', label: 'b2', labelInMinor: 'b2', inMajor: false, inMinor: false, chordQualityInMajor: null, chordQualityInMinor: null },
            { offset: 8, type: 'minor', label: 'b6', labelInMinor: '6', inMajor: false, inMinor: true, chordQualityInMajor: null, chordQualityInMinor: 'maj' },
            { offset: 9, type: 'minor', label: 'b3', labelInMinor: '3', inMajor: false, inMinor: true, chordQualityInMajor: null, chordQualityInMinor: 'maj' },
            { offset: 10, type: 'wholestep', label: 'b7', labelInMinor: '7', inMajor: false, inMinor: true, chordQualityInMajor: null, chordQualityInMinor: 'maj' },
            { offset: 11, type: 'perfect', label: '4', labelInMinor: '4', inMajor: true, inMinor: true, chordQualityInMajor: 'maj', chordQualityInMinor: 'min' }
        ];
        
        // Create note headers
        const gridContainer = document.querySelector('.omnichord-grid');
        const noteHeadersDiv = document.createElement('div');
        noteHeadersDiv.className = 'note-headers';
        columns.forEach(note => {
            const header = document.createElement('div');
            header.className = 'note-header';
            header.textContent = note;
            noteHeadersDiv.appendChild(header);
        });
        gridContainer.insertBefore(noteHeadersDiv, gridContainer.firstChild);
        
        // Create grid buttons
        ['maj', 'min'].forEach(rowId => {
            const rowContainer = document.getElementById(`${rowId}Row`);
            columns.forEach((note, colIndex) => {
                const button = document.createElement('div');
                button.className = 'grid-button';
                button.innerHTML = '';
                button.dataset.col = colIndex;
                button.dataset.row = rowId;
                button.dataset.note = note;
                
                // Add click handler to set root
                button.addEventListener('click', () => {
                    sharedSelectedRoot = note;
                    sharedSelectedMode = rowId;
                    updateGridIntervals();
                    if (typeof window.updateCircleOfFifthsFromGrid === 'function') {
                        window.updateCircleOfFifthsFromGrid();
                    }
                });
                
                rowContainer.appendChild(button);
            });
        });
        
        // Update grid colors based on selected root
        function updateGridIntervals() {
            // Clear all interval classes and inline styles
            document.querySelectorAll('.grid-button').forEach(btn => {
                btn.classList.remove('interval-root', 'interval-major', 'interval-minor', 'interval-perfect', 'interval-tritone', 'interval-wholestep', 'interval-gray', 'dimmed');
                btn.style.opacity = '';
                btn.innerHTML = '';
            });
            
            if (!sharedSelectedRoot) return;
            
            // Find root column index
            const rootColIndex = columns.indexOf(sharedSelectedRoot);
            if (rootColIndex === -1) return;
            
            // Color code each button based on its interval from root
            columns.forEach((note, colIndex) => {
                // Calculate interval offset from root
                let offset = colIndex - rootColIndex;
                if (offset < 0) offset += columns.length;
                
                const intervalInfo = columnIntervals.find(i => i.offset === offset);
                if (!intervalInfo) return;
                
                ['maj', 'min'].forEach(rowId => {
                    const gridButton = document.querySelector(
                        `.grid-button[data-col="${colIndex}"][data-row="${rowId}"]`
                    );
                    if (gridButton) {
                        // Check if note is in the selected scale
                        const inScale = sharedSelectedMode === 'maj' ? intervalInfo.inMajor : intervalInfo.inMinor;
                        const isTritone = intervalInfo.type === 'tritone';
                        
                        // Color based on whether in scale (matching circle of fifths)
                        if (!inScale && !isTritone) {
                            // Out of scale (except tritone) - show as gray
                            gridButton.classList.add('interval-gray');
                        } else {
                            // In scale or tritone - show interval color
                            gridButton.classList.add(`interval-${intervalInfo.type}`);
                            
                            // Tritone out of scale gets dimmed
                            if (!inScale && isTritone) {
                                gridButton.style.opacity = '0.5';
                            }
                        }
                        
                        if (intervalInfo.label) {
                            // Use context-appropriate label based on selected scale
                            const displayLabel = sharedSelectedMode === 'min' ? intervalInfo.labelInMinor : intervalInfo.label;
                            gridButton.innerHTML = displayLabel;
                        }
                        
                        // Dim based on chord quality for in-scale notes
                        if (inScale) {
                            const chordQuality = sharedSelectedMode === 'maj' ? intervalInfo.chordQualityInMajor : intervalInfo.chordQualityInMinor;
                            
                            // Determine if this button should be highlighted
                            let shouldHighlight = false;
                            if (chordQuality === 'maj' && rowId === 'maj') {
                                shouldHighlight = true;
                            } else if (chordQuality === 'min' && rowId === 'min') {
                                shouldHighlight = true;
                            } else if (chordQuality === 'dim') {
                                // Diminished uses both rows
                                shouldHighlight = true;
                            }
                            
                            if (!shouldHighlight) {
                                // In scale but wrong chord quality for this row
                                gridButton.classList.add('dimmed');
                            }
                        }
                    }
                });
            });
        }
        
        // Initialize with C Major selected
        updateGridIntervals();
    }
    
    initializeOmnichordGrid();
});