class ReverseDataTool {
    constructor() {
        this.rawData = [];
        this.byteStates = [];
        this.stagedBytes = [];
        this.suggestions = [];
        this.acceptedDecodings = [];
        this.toastContainer = null;
        this.isAccountData = false;
        this.currentAccountInfo = null;
        
        // Load RPC settings
        this.solanaRpcUrls = this.loadRpcEndpoints();
        this.currentRpcIndex = 0;
        this.rpcTimeout = this.loadRpcTimeout();
        this.enableBatching = this.loadBatchingEnabled();
        
        // Known Solana program addresses
        this.knownPrograms = {
            '11111111111111111111111111111111': 'System Program',
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token Program',
            'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'Token-2022 Program',
            'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
            'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf': 'Squads v3 Program',
            'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu': 'Squads v4 Program',
            'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Metadata',
            'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98': 'Metaplex Token Metadata',
            'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ': 'Candy Machine v2',
            'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR': 'Candy Machine v3',
            'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter Aggregator',
            '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Raydium AMM',
            'EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q': 'Raydium Staking',
            'ComputeBudget111111111111111111111111111111': 'Compute Budget Program',
            'AddressLookupTab1e1111111111111111111111111': 'Address Lookup Table Program',
            '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P': 'Pump.fun Program'
        };
        
        // Token account data size (165 bytes for SPL Token)
        this.TOKEN_ACCOUNT_SIZE = 165;
        this.TOKEN_MINT_SIZE = 82;
        
        // Account caching
        this.accountCache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // Pattern database
        this.patterns = null;
        this.loadPatternDatabase();
        
        this.initializeEventListeners();
        this.initializeToastContainer();
        this.initializeSettingsModal();
        this.checkFirstTimeSetup();
    }
    
    initializeEventListeners() {
        document.getElementById('processBtn').addEventListener('click', () => {
            this.processHexInput();
        });
        
        document.getElementById('hexInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default textarea behavior
                this.processHexInput();
            }
        });
    }
    
    initializeToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.toastContainer);
    }
    
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `p-3 rounded-lg text-white font-medium shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;
        
        switch (type) {
            case 'success':
                toast.classList.add('bg-green-500');
                break;
            case 'error':
                toast.classList.add('bg-red-500');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500');
                break;
            default:
                toast.classList.add('bg-blue-500');
        }
        
        toast.textContent = message;
        this.toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 10);
        
        // Auto-remove toast
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    clearAllLists() {
        // Clear all data structures
        this.suggestions = [];
        this.acceptedDecodings = [];
        this.stagedBytes = [];
        this.isAccountData = false;
        this.currentAccountInfo = null;
        
        // Clear UI elements
        document.getElementById('acceptedList').innerHTML = '<p class="text-gray-500 text-sm">No accepted decodings yet</p>';
        document.getElementById('suggestionsList').innerHTML = '<p class="text-gray-500 text-sm">Enter hex data to see smart suggestions</p>';
        document.getElementById('selectionDecodeList').innerHTML = '<p class="text-gray-500 text-sm">Select bytes to see interpretations</p>';
        
        // Remove account info box if it exists
        const existingAccountBox = document.getElementById('account-info-box');
        if (existingAccountBox) {
            existingAccountBox.remove();
        }
    }
    
    clearAccountCache() {
        this.accountCache.clear();
        this.showToast('Account cache cleared', 'success', 2000);
        console.log('Account cache cleared');
    }
    
    async loadPatternDatabase() {
        try {
            const response = await fetch('patterns.json');
            this.patterns = await response.json();
            console.log('Pattern database loaded:', Object.keys(this.patterns).length, 'categories');
        } catch (error) {
            console.warn('Failed to load pattern database:', error.message);
            this.patterns = {};
        }
    }
    
    isSolanaAccountAddress(input) {
        // Check if input looks like a Solana account address
        // Must be valid base58 and decode to exactly 32 bytes
        if (!input || input.length < 32 || input.length > 44) {
            return false;
        }
        
        if (!this.isValidBase58(input)) {
            return false;
        }
        
        try {
            const decoded = this.base58Decode(input);
            return decoded.length === 32;
        } catch (error) {
            return false;
        }
    }
    
    async processSolanaAccountInput(accountAddress) {
        this.showToast(`Fetching account data for ${accountAddress.substring(0, 8)}...`, 'info', 3000);
        
        try {
            const result = await this.fetchSolanaAccountData(accountAddress);
            
            if (!result) {
                this.showToast('Account not found or has no data', 'error');
                return;
            }
            
            // Clear all previous data
            this.clearAllLists();
            
            // Set account data mode
            this.isAccountData = true;
            this.currentAccountInfo = {
                address: accountAddress,
                ...result.accountInfo,
                isPDA: await this.checkIfPDA(accountAddress)
            };
            
            // Convert account data to hex bytes
            this.rawData = result.accountData;
            this.byteStates = new Array(result.accountData.length).fill('undefined');
            this.stagedBytes = [];
            
            this.showToast(`Loaded ${result.accountData.length} bytes from account`, 'success');
            
            this.renderAccountInfoBox();
            this.renderHexdump();
            this.generateSuggestions();
            this.updateSelectionDecode();
            
        } catch (error) {
            console.error('Error fetching account data:', error);
            this.showToast('Failed to fetch account data', 'error');
        }
    }
    
    async fetchSolanaAccountData(accountAddress) {
        for (let i = 0; i < this.solanaRpcUrls.length; i++) {
            const rpcUrl = this.solanaRpcUrls[i];
            
            try {
                const requestBody = {
                    jsonrpc: '2.0',
                    id: 'fetch_account_data',
                    method: 'getAccountInfo',
                    params: [accountAddress, { encoding: 'base64' }]
                };
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.rpcTimeout);
                
                const response = await fetch(rpcUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    this.handleRpcError(response.status, 'fetchSolanaAccountData');
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error.message);
                }
                
                if (!data.result || !data.result.value) {
                    return null; // Account not found
                }
                
                const accountInfo = data.result.value;
                
                if (!accountInfo.data || !accountInfo.data[0]) {
                    return null; // No account data
                }
                
                // Decode base64 data to bytes
                const base64Data = accountInfo.data[0];
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                return {
                    accountData: Array.from(bytes),
                    accountInfo: {
                        owner: accountInfo.owner,
                        lamports: accountInfo.lamports,
                        executable: accountInfo.executable,
                        rentEpoch: accountInfo.rentEpoch
                    }
                };
                
            } catch (error) {
                console.log(`Error with RPC ${rpcUrl}:`, error.message);
                if (i === this.solanaRpcUrls.length - 1) {
                    throw error;
                }
            }
        }
    }
    
    checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const accountParam = urlParams.get('account');
        
        if (accountParam && this.isSolanaAccountAddress(accountParam)) {
            document.getElementById('hexInput').value = accountParam;
            // Process the account immediately since DOM is already ready
            this.processHexInput();
        }
    }
    
    base58Decode(str) {
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const base = BigInt(58);
        
        let decoded = BigInt(0);
        let multi = BigInt(1);
        
        for (let i = str.length - 1; i >= 0; i--) {
            const char = str[i];
            const index = alphabet.indexOf(char);
            if (index === -1) {
                throw new Error(`Invalid base58 character: ${char}`);
            }
            decoded += BigInt(index) * multi;
            multi *= base;
        }
        
        // Convert to bytes
        const bytes = [];
        while (decoded > 0) {
            bytes.unshift(Number(decoded % BigInt(256)));
            decoded = decoded / BigInt(256);
        }
        
        // Handle leading zeros
        for (let i = 0; i < str.length && str[i] === '1'; i++) {
            bytes.unshift(0);
        }
        
        return bytes;
    }
    
    async processHexInput() {
        const input = document.getElementById('hexInput').value.trim();
        
        // Check if input is a Solana account address
        if (this.isSolanaAccountAddress(input)) {
            await this.processSolanaAccountInput(input);
            return;
        }
        
        const hexData = this.parseHexInput(input);
        
        if (hexData.length === 0) {
            alert('Please enter valid hex data or Solana account address');
            return;
        }
        
        // Clear all previous data when loading new hex data
        this.clearAllLists();
        
        this.rawData = hexData;
        this.byteStates = new Array(hexData.length).fill('undefined');
        this.stagedBytes = [];
        this.renderHexdump();
        this.generateSuggestions();
        this.updateSelectionDecode();
    }
    
    parseHexInput(input) {
        const cleanInput = input.replace(/\s+/g, '').replace(/0x/gi, '');
        
        if (!/^[0-9a-fA-F]*$/.test(cleanInput)) {
            return [];
        }
        
        if (cleanInput.length % 2 !== 0) {
            return [];
        }
        
        const bytes = [];
        for (let i = 0; i < cleanInput.length; i += 2) {
            bytes.push(parseInt(cleanInput.substr(i, 2), 16));
        }
        
        return bytes;
    }
    
    renderHexdump() {
        const container = document.getElementById('hexdump');
        container.innerHTML = '';
        
        const bytesPerRow = 16;
        const totalRows = Math.ceil(this.rawData.length / bytesPerRow);
        
        for (let row = 0; row < totalRows; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'flex items-center mb-1';
            
            const offsetDiv = document.createElement('div');
            offsetDiv.className = 'text-gray-500 mr-4 w-20 text-xs';
            offsetDiv.textContent = (row * bytesPerRow).toString(16).padStart(8, '0').toUpperCase();
            rowDiv.appendChild(offsetDiv);
            
            const bytesDiv = document.createElement('div');
            bytesDiv.className = 'flex flex-wrap gap-0.5 mr-4';
            
            const startIdx = row * bytesPerRow;
            const endIdx = Math.min(startIdx + bytesPerRow, this.rawData.length);
            
            for (let i = startIdx; i < endIdx; i++) {
                const byteSpan = document.createElement('span');
                let classes = ['hex-byte', 'px-1', 'py-0.5', 'rounded', 'text-xs', 'cursor-pointer', 'min-w-[24px]', 'text-center'];
                
                if (this.byteStates[i] === 'decoded') {
                    classes.push('bg-green-200', 'text-green-800');
                } else if (this.stagedBytes.includes(i)) {
                    classes.push('bg-blue-200', 'text-blue-800', 'ring-1', 'ring-blue-400');
                } else if (this.isMaxConfidenceByte(i)) {
                    classes.push('bg-blue-400', 'text-white', 'shadow-lg', 'shadow-blue-300', 'ring-2', 'ring-blue-500', 'max-confidence-glow');
                } else {
                    classes.push('text-gray-700', 'hover:bg-gray-200');
                }
                
                byteSpan.className = classes.join(' ');
                byteSpan.textContent = this.rawData[i].toString(16).padStart(2, '0').toUpperCase();
                byteSpan.dataset.index = i;
                
                byteSpan.addEventListener('mouseenter', () => this.onByteHover(i));
                byteSpan.addEventListener('mouseleave', () => this.onByteUnhover(i));
                byteSpan.addEventListener('click', () => {
                    if (this.isMaxConfidenceByte(i)) {
                        this.acceptMaxConfidenceSuggestion(i);
                    } else {
                        this.toggleByteStaging(i);
                    }
                });
                
                bytesDiv.appendChild(byteSpan);
                
                if ((i - startIdx + 1) % 8 === 0 && i < endIdx - 1) {
                    const spacer = document.createElement('span');
                    spacer.className = 'w-2';
                    bytesDiv.appendChild(spacer);
                }
            }
            
            rowDiv.appendChild(bytesDiv);
            
            const asciiDiv = document.createElement('div');
            asciiDiv.className = 'text-gray-500 text-xs';
            let asciiText = '';
            for (let i = startIdx; i < endIdx; i++) {
                const byte = this.rawData[i];
                asciiText += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
            }
            asciiDiv.textContent = asciiText;
            rowDiv.appendChild(asciiDiv);
            
            container.appendChild(rowDiv);
        }
    }
    
    onByteHover(index) {
        this.highlightByte(index);
        this.highlightDecodingForByte(index);
    }
    
    onByteUnhover(index) {
        this.unhighlightByte(index);
        this.unhighlightAllDecodings();
    }
    
    highlightByte(index) {
        const byteElement = document.querySelector(`[data-index="${index}"]`);
        if (byteElement && !byteElement.classList.contains('bg-green-200') && !byteElement.classList.contains('bg-blue-200') && !this.isMaxConfidenceByte(index)) {
            byteElement.classList.add('bg-yellow-200');
        }
    }
    
    unhighlightByte(index) {
        const byteElement = document.querySelector(`[data-index="${index}"]`);
        if (byteElement) {
            byteElement.classList.remove('bg-yellow-200');
        }
    }
    
    highlightRange(startIndex, endIndex) {
        for (let i = startIndex; i < endIndex; i++) {
            const byteElement = document.querySelector(`[data-index="${i}"]`);
            if (byteElement) {
                // Remove green background if present and add yellow with higher priority
                byteElement.classList.remove('bg-green-200');
                byteElement.classList.add('bg-yellow-200', 'ring-2', 'ring-yellow-400');
            }
        }
    }
    
    unhighlightRange(startIndex, endIndex) {
        for (let i = startIndex; i < endIndex; i++) {
            const byteElement = document.querySelector(`[data-index="${i}"]`);
            if (byteElement) {
                byteElement.classList.remove('bg-yellow-200', 'ring-2', 'ring-yellow-400');
                // Restore green background if this byte is decoded
                if (this.byteStates[i] === 'decoded') {
                    byteElement.classList.add('bg-green-200');
                }
            }
        }
    }
    
    highlightDecodingForByte(index) {
        const decoding = this.acceptedDecodings.find(d => 
            index >= d.range[0] && index < d.range[1]
        );
        if (decoding) {
            const decodingIndex = this.acceptedDecodings.indexOf(decoding);
            const decodingElement = document.querySelector(`[data-decoding-index="${decodingIndex}"]`);
            if (decodingElement) {
                decodingElement.classList.add('bg-yellow-100', 'ring-2', 'ring-yellow-400');
            }
        }
    }
    
    unhighlightAllDecodings() {
        document.querySelectorAll('[data-decoding-index]').forEach(el => {
            el.classList.remove('bg-yellow-100', 'ring-2', 'ring-yellow-400');
        });
    }
    
    toggleByteStaging(index) {
        if (this.byteStates[index] === 'decoded') {
            return;
        }
        
        const stagedIndex = this.stagedBytes.indexOf(index);
        if (stagedIndex > -1) {
            this.stagedBytes.splice(stagedIndex, 1);
        } else {
            this.stagedBytes.push(index);
        }
        
        this.stagedBytes.sort((a, b) => a - b);
        this.ensureSequentialStaging();
        this.renderHexdump();
        this.updateSelectionDecode();
    }
    
    ensureSequentialStaging() {
        if (this.stagedBytes.length <= 1) return;
        
        this.stagedBytes.sort((a, b) => a - b);
        const sequentialBytes = [this.stagedBytes[0]];
        
        for (let i = 1; i < this.stagedBytes.length; i++) {
            if (this.stagedBytes[i] === sequentialBytes[sequentialBytes.length - 1] + 1) {
                sequentialBytes.push(this.stagedBytes[i]);
            } else {
                break;
            }
        }
        
        this.stagedBytes = sequentialBytes;
    }
    
    updateSelectionDecode() {
        const container = document.getElementById('selectionDecodeList');
        const scrollIndicator = document.getElementById('scrollIndicator');
        container.innerHTML = '';
        
        if (this.stagedBytes.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Select bytes to see interpretations</p>';
            scrollIndicator.classList.add('hidden');
            return;
        }
        
        const interpretations = this.generateInterpretations(this.stagedBytes);
        interpretations.forEach(interpretation => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-1.5 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors';
            item.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-medium text-gray-800">${interpretation.type}</span>
                        <span class="text-gray-600 truncate ml-2">${interpretation.value}</span>
                    </div>
                </div>
            `;
            item.addEventListener('click', () => this.acceptSelectionDecode(interpretation));
            container.appendChild(item);
        });
        
        // Check if scrolling is needed and show/hide indicator
        this.updateScrollIndicator();
    }
    
    updateScrollIndicator() {
        const container = document.getElementById('selectionDecodeList');
        const scrollIndicator = document.getElementById('scrollIndicator');
        
        // Check if content overflows
        setTimeout(() => {
            if (container.scrollHeight > container.clientHeight) {
                scrollIndicator.classList.remove('hidden');
                
                // Hide indicator when scrolled to bottom
                const checkScroll = () => {
                    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
                    if (isAtBottom) {
                        scrollIndicator.classList.add('hidden');
                    } else {
                        scrollIndicator.classList.remove('hidden');
                    }
                };
                
                container.addEventListener('scroll', checkScroll);
                checkScroll(); // Initial check
            } else {
                scrollIndicator.classList.add('hidden');
            }
        }, 10);
    }
    
    generateInterpretations(indices) {
        if (indices.length === 0) return [];
        
        const bytes = indices.map(i => this.rawData[i]);
        const interpretations = [];
        
        if (indices.length === 1) {
            const byteValue = bytes[0];
            
            interpretations.push({
                type: 'u8',
                value: byteValue.toString(),
                range: [indices[0], indices[0] + 1]
            });
            
            // Add boolean interpretation for 0 and 1
            if (byteValue === 0 || byteValue === 1) {
                interpretations.push({
                    type: 'Bool',
                    value: byteValue === 1 ? 'true' : 'false',
                    range: [indices[0], indices[0] + 1]
                });
                
                // Add Option interpretation
                interpretations.push({
                    type: 'Option',
                    value: byteValue === 1 ? 'Some' : 'None',
                    range: [indices[0], indices[0] + 1]
                });
            }
            
            // Add bump interpretation for 252-255
            if (byteValue >= 252 && byteValue <= 255) {
                interpretations.push({
                    type: 'Bump',
                    value: `${byteValue} (bump seed)`,
                    range: [indices[0], indices[0] + 1]
                });
            }
        }
        
        if (indices.length >= 2) {
            const u16LE = bytes[0] | (bytes[1] << 8);
            const u16BE = (bytes[0] << 8) | bytes[1];
            interpretations.push({
                type: 'u16 (LE)',
                value: u16LE.toString(),
                range: [indices[0], indices[0] + 2]
            });
            interpretations.push({
                type: 'u16 (BE)',
                value: u16BE.toString(),
                range: [indices[0], indices[0] + 2]
            });
        }
        
        if (indices.length >= 4) {
            const u32LE = this.readUInt32LE(indices[0]);
            const u32BE = this.readUInt32BE(indices[0]);
            const i32LE = this.readInt32LE(indices[0]);
            const f32LE = this.readFloat32LE(indices[0]);
            
            interpretations.push({
                type: 'u32 (LE)',
                value: u32LE.toString(),
                range: [indices[0], indices[0] + 4]
            });
            interpretations.push({
                type: 'i32 (LE)',
                value: i32LE.toString(),
                range: [indices[0], indices[0] + 4]
            });
            interpretations.push({
                type: 'f32 (LE)',
                value: f32LE.toFixed(6),
                range: [indices[0], indices[0] + 4]
            });
            
            if (u32LE > 946684800 && u32LE < 4102444800) { // 2000-01-01 to 2100-01-01
                const timestamp = new Date(u32LE * 1000);
                const now = new Date();
                const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
                const hundredYearsFromNow = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
                
                if (timestamp >= fiveYearsAgo && timestamp <= hundredYearsFromNow) {
                    interpretations.push({
                        type: 'Unix Timestamp',
                        value: timestamp.toISOString(),
                        range: [indices[0], indices[0] + 4]
                    });
                }
            }
        }
        
        if (indices.length >= 8) {
            const u64LE = this.readUInt64LE(indices[0]);
            const f64LE = this.readFloat64LE(indices[0]);
            
            interpretations.push({
                type: 'u64 (LE)',
                value: u64LE.toString(),
                range: [indices[0], indices[0] + 8]
            });
            interpretations.push({
                type: 'f64 (LE)',
                value: f64LE.toFixed(6),
                range: [indices[0], indices[0] + 8]
            });
        }
        
        if (indices.length === 32) {
            const pubkeyHex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
            const pubkeyBase58 = this.hexToBase58(pubkeyHex);
            
            // Add initial pubkey interpretation
            const pubkeyInterpretation = {
                type: 'Solana Pubkey',
                value: pubkeyBase58,
                range: [indices[0], indices[0] + 32],
                isChecking: true
            };
            
            interpretations.push(pubkeyInterpretation);
            
            // Check if account exists asynchronously
            this.checkPubkeyExists(pubkeyBase58, pubkeyInterpretation);
        }
        
        return interpretations;
    }
    
    acceptSelectionDecode(interpretation) {
        const name = prompt('Enter a name for this field:', `field_${this.acceptedDecodings.length}`);
        if (name === null) return;
        
        for (let i = interpretation.range[0]; i < interpretation.range[1]; i++) {
            this.byteStates[i] = 'decoded';
        }
        
        this.acceptedDecodings.push({
            name: name || `field_${this.acceptedDecodings.length}`,
            type: interpretation.type,
            value: interpretation.value,
            range: interpretation.range,
            offset: interpretation.range[0]
        });
        
        this.stagedBytes = [];
        this.renderHexdump();
        this.updateSelectionDecode();
        this.updateAcceptedDecodings();
    }
    
    updateAcceptedDecodings() {
        const container = document.getElementById('acceptedList');
        container.innerHTML = '';
        
        if (this.acceptedDecodings.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No accepted decodings yet</p>';
            return;
        }
        
        this.acceptedDecodings.sort((a, b) => a.offset - b.offset);
        
        this.acceptedDecodings.forEach((decoding, index) => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer';
            item.dataset.decodingIndex = index;
            
            // Check if this is a Solana pubkey
            const isSolanaPubkey = decoding.type === 'Solana Pubkey';
            let solanaButtons = '';
            
            if (isSolanaPubkey) {
                const pubkey = decoding.value.split(' (')[0]; // Extract pubkey from "pubkey (account type)" format
                solanaButtons = `
                    <button class="ml-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" 
                            onclick="reverseDataTool.openSolscan('${pubkey}')" title="View on Solscan">
                        📊
                    </button>
                    <button class="ml-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors" 
                            onclick="reverseDataTool.analyzeAccount('${pubkey}')" title="Analyze account data">
                        🔍
                    </button>
                `;
            }
            
            item.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-800 cursor-text hover:bg-gray-100 rounded px-1 py-0.5 transition-colors" 
                         onclick="reverseDataTool.editDecodingName(${index}, this)"
                         title="Click to edit name">${decoding.name}</div>
                    <div class="text-xs text-gray-600">${decoding.type} @ ${decoding.offset}</div>
                    <div class="text-xs text-gray-700 truncate">${decoding.value}</div>
                </div>
                <div class="flex items-center">
                    ${solanaButtons}
                    <button class="ml-2 text-red-500 hover:text-red-700 text-lg font-bold" onclick="reverseDataTool.removeAcceptedDecoding(${index})">×</button>
                </div>
            `;
            
            item.addEventListener('mouseenter', () => this.highlightRange(decoding.range[0], decoding.range[1]));
            item.addEventListener('mouseleave', () => this.unhighlightRange(decoding.range[0], decoding.range[1]));
            
            container.appendChild(item);
        });
    }
    
    editDecodingName(index, element) {
        const currentName = this.acceptedDecodings[index].name;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'font-medium text-sm text-gray-800 bg-white border border-blue-300 rounded px-1 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
        
        // Replace the div with input
        element.parentNode.replaceChild(input, element);
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                this.acceptedDecodings[index].name = newName;
            }
            this.updateAcceptedDecodings();
        };
        
        const cancelEdit = () => {
            this.updateAcceptedDecodings();
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }
    
    removeAcceptedDecoding(index) {
        const decoding = this.acceptedDecodings[index];
        for (let i = decoding.range[0]; i < decoding.range[1]; i++) {
            this.byteStates[i] = 'undefined';
        }
        
        this.acceptedDecodings.splice(index, 1);
        this.renderHexdump();
        this.updateAcceptedDecodings();
    }
    
    async generateSuggestions() {
        this.suggestions = [];
        
        // Show initial suggestions
        this.detectDiscriminator();
        this.detectSpecialNumbers();
        this.detectMeaningfulStrings();
        this.detectPatternMatches();
        this.renderSuggestions();
        
        // Show loading indicator for Solana detection
        this.showSolanaLoadingIndicator();
        
        // Detect Solana accounts (this may take time)
        await this.detectSolanaAccounts();
        
        // Hide loading indicator and update final suggestions
        this.hideSolanaLoadingIndicator();
        this.renderSuggestions();
        this.highlightMaxConfidenceSuggestions();
    }
    
    showSolanaLoadingIndicator() {
        const container = document.getElementById('suggestionsList');
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'solana-loading';
        loadingDiv.className = 'flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200';
        loadingDiv.innerHTML = `
            <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span class="text-sm text-blue-700">Checking Solana blockchain...</span>
        `;
        container.appendChild(loadingDiv);
    }
    
    hideSolanaLoadingIndicator() {
        const loadingDiv = document.getElementById('solana-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    isAllZeros(startIndex, length) {
        for (let i = startIndex; i < startIndex + length && i < this.rawData.length; i++) {
            if (this.rawData[i] !== 0) {
                return false;
            }
        }
        return true;
    }
    
    detectDiscriminator() {
        // Only suggest discriminator for account data
        if (!this.isAccountData || this.rawData.length < 8) {
            return;
        }
        
        // Check if first 8 bytes are available for suggestion
        if (this.byteStates.slice(0, 8).every(state => state === 'undefined')) {
            const discriminatorBytes = this.rawData.slice(0, 8);
            const discriminatorHex = discriminatorBytes.map(b => b.toString(16).padStart(2, '0')).join('');
            
            this.suggestions.push({
                type: 'Discriminator',
                range: [0, 8],
                value: `0x${discriminatorHex}`,
                confidence: 0.95
            });
        }
    }
    
    async checkIfPDA(pubkey) {
        try {
            // Simple check - if pubkey is on curve it's not a PDA
            // This is a simplified implementation
            // In a full implementation, you'd use ed25519 curve math
            return false; // For now, assume all are regular accounts
        } catch (error) {
            return false;
        }
    }
    
    renderAccountInfoBox() {
        if (!this.isAccountData || !this.currentAccountInfo) {
            return;
        }
        
        // Find the hexdump container parent
        const hexdumpParent = document.getElementById('hexdump').parentElement;
        
        // Remove existing account info box if present
        const existingBox = document.getElementById('account-info-box');
        if (existingBox) {
            existingBox.remove();
        }
        
        // Create account info box
        const accountInfoBox = document.createElement('div');
        accountInfoBox.id = 'account-info-box';
        accountInfoBox.className = 'bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3';
        
        const ownerProgram = this.knownPrograms[this.currentAccountInfo.owner] || 'Unknown Program';
        const solAmount = (this.currentAccountInfo.lamports / 1e9).toFixed(4);
        const pdaStatus = this.currentAccountInfo.isPDA ? 'PDA' : 'Regular';
        
        accountInfoBox.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                        <span class="font-medium text-gray-600">Account:</span>
                        <div class="font-mono text-gray-800">${this.currentAccountInfo.address.substring(0, 8)}...${this.currentAccountInfo.address.slice(-4)}</div>
                    </div>
                    <div>
                        <span class="font-medium text-gray-600">Owner:</span>
                        <div class="text-gray-800">${ownerProgram}</div>
                        <div class="font-mono text-gray-500 text-xs">${this.currentAccountInfo.owner}</div>
                    </div>
                    <div>
                        <span class="font-medium text-gray-600">Details:</span>
                        <div class="text-gray-800">${solAmount} SOL • ${this.rawData.length} bytes • ${pdaStatus}</div>
                    </div>
                </div>
                <div class="flex gap-1 ml-3">
                    <button onclick="reverseDataTool.openSolscan('${this.currentAccountInfo.address}')" 
                            class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" title="View on Solscan">
                        📊
                    </button>
                    <button onclick="reverseDataTool.openCreateAccountInstruction('${this.currentAccountInfo.address}')" 
                            class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors" title="Find creation IX">
                        🔍
                    </button>
                </div>
            </div>
        `;
        
        // Insert before hexdump
        hexdumpParent.insertBefore(accountInfoBox, hexdumpParent.firstChild);
    }
    
    openCreateAccountInstruction(pubkey) {
        // Open Solscan to search for createAccount instruction for this account
        window.open(`https://solscan.io/account/${pubkey}#transactions`, '_blank');
    }
    
    detectPatternMatches() {
        if (!this.patterns) {
            return; // Pattern database not loaded yet
        }
        
        // Convert raw data to hex string for pattern matching
        const hexString = this.rawData.map(byte => byte.toString(16).padStart(2, '0')).join('');
        
        // Check all pattern categories
        for (const [category, patterns] of Object.entries(this.patterns)) {
            for (const [pattern, description] of Object.entries(patterns)) {
                // Find all occurrences of this pattern
                let index = 0;
                while (index < hexString.length) {
                    const foundIndex = hexString.indexOf(pattern.toLowerCase(), index);
                    if (foundIndex === -1) break;
                    
                    // Convert hex character index to byte index
                    const byteOffset = foundIndex / 2;
                    const patternLength = pattern.length / 2;
                    
                    // Skip if this would go beyond our data
                    if (byteOffset + patternLength > this.rawData.length) break;
                    
                    // Only suggest if bytes are not already decoded
                    if (this.byteStates.slice(byteOffset, byteOffset + patternLength).every(state => state === 'undefined')) {
                        // Determine confidence based on pattern category
                        let confidence = 0.8; // Default confidence
                        let categoryName = category;
                        
                        if (category === 'discriminators') {
                            confidence = 0.95;
                            categoryName = 'Known Discriminator';
                        } else if (category === 'constants') {
                            confidence = 0.85;
                            categoryName = 'Known Constant';
                        }
                        
                        this.suggestions.push({
                            type: categoryName,
                            range: [byteOffset, byteOffset + patternLength],
                            value: description,
                            confidence: confidence,
                            pattern: pattern.toUpperCase()
                        });
                        
                        console.log(`[PATTERN HIT] Found ${categoryName} at offset ${byteOffset}: ${pattern.toUpperCase()} -> "${description}"`);
                    }
                    
                    // Continue searching after this match
                    index = foundIndex + 2; // Move by 1 byte (2 hex chars)
                }
            }
        }
    }
    
    detectSpecialNumbers() {
        const specialValues = new Set([0, 1, -1, 10, 100, 1000, 10000, 100000, 1000000, 1000000000, 10000000000, 100000000000]);
        const roundValues = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 1000000000, 10000000000, 100000000000];
        const repeatingPatterns = [11111, 22222, 33333, 44444, 55555, 66666, 77777, 88888, 99999, 111111, 222222, 333333, 444444, 555555, 666666, 777777, 888888, 999999];
        
        // Check 4-byte integers
        for (let i = 0; i <= this.rawData.length - 4; i++) {
            if (this.byteStates.slice(i, i + 4).every(state => state === 'undefined')) {
                // Skip if all bytes are zero
                if (this.isAllZeros(i, 4)) {
                    continue;
                }
                
                const u32LE = this.readUInt32LE(i);
                const i32LE = this.readInt32LE(i);
                
                // Special values (excluding 0 since we skip all-zero sequences)
                if (specialValues.has(u32LE) && u32LE !== 0) {
                    this.suggestions.push({
                        type: 'u32',
                        range: [i, i + 4],
                        value: u32LE.toString(),
                        confidence: 0.9
                    });
                } else if (specialValues.has(i32LE) && i32LE !== 0) {
                    this.suggestions.push({
                        type: 'i32',
                        range: [i, i + 4],
                        value: i32LE.toString(),
                        confidence: 0.9
                    });
                }
                
                // Round decimal values
                else if (roundValues.includes(u32LE)) {
                    this.suggestions.push({
                        type: 'u32',
                        range: [i, i + 4],
                        value: u32LE.toString(),
                        confidence: 0.8
                    });
                }
                
                // Repeating digit patterns
                else if (repeatingPatterns.includes(u32LE)) {
                    this.suggestions.push({
                        type: 'u32 (pattern)',
                        range: [i, i + 4],
                        value: u32LE.toString(),
                        confidence: 0.75
                    });
                }
                
                // Unix timestamps (smart range: 5 years back to 5 years future)
                else if (u32LE > 946684800 && u32LE < 4102444800) { // 2000-01-01 to 2100-01-01
                    const date = new Date(u32LE * 1000);
                    const now = new Date();
                    const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
                    const fiveYearsFromNow = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
                    
                    if (date >= fiveYearsAgo && date <= fiveYearsFromNow) {
                        let confidence = 0.75;
                        
                        // Higher confidence for exact times (seconds = 0)
                        if (date.getSeconds() === 0) {
                            confidence = 0.85;
                            
                            // Even higher for exact minutes (minutes = 0 too)
                            if (date.getMinutes() === 0) {
                                confidence = 0.9;
                            }
                        }
                        
                        this.suggestions.push({
                            type: 'Unix Timestamp',
                            range: [i, i + 4],
                            value: date.toISOString(),
                            confidence: confidence
                        });
                    }
                }
                
                // Powers of 2
                else if ((u32LE & (u32LE - 1)) === 0 && u32LE > 1 && u32LE <= 1048576) {
                    this.suggestions.push({
                        type: 'u32 (power of 2)',
                        range: [i, i + 4],
                        value: u32LE.toString(),
                        confidence: 0.7
                    });
                }
            }
        }
        
        // Check 8-byte integers for special values
        for (let i = 0; i <= this.rawData.length - 8; i++) {
            if (this.byteStates.slice(i, i + 8).every(state => state === 'undefined')) {
                // Skip if all bytes are zero
                if (this.isAllZeros(i, 8)) {
                    continue;
                }
                
                const u64LE = this.readUInt64LE(i);
                const u64Value = Number(u64LE);
                
                if ((specialValues.has(u64Value) && u64Value !== 0) || roundValues.includes(u64Value)) {
                    this.suggestions.push({
                        type: 'u64',
                        range: [i, i + 8],
                        value: u64LE.toString(),
                        confidence: 0.8
                    });
                }
            }
        }
    }
    
    detectMeaningfulStrings() {
        const commonWords = new Set([
            'the', 'and', 'http', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'may', 'she', 'use', 'your', 'each', 'make', 'most', 'over', 'said', 'some', 'time', 'very', 'what', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'look', 'than', 'come', 'could', 'first', 'into', 'made', 'many', 'more', 'only', 'over', 'such', 'take', 'than', 'them', 'well', 'were',
            'error', 'info', 'warn', 'debug', 'trace', 'log', 'message', 'data', 'file', 'path', 'name', 'value', 'key', 'id', 'index', 'count', 'size', 'length', 'width', 'height', 'type', 'format', 'version', 'config', 'setting', 'option', 'param', 'arg', 'flag', 'status', 'state', 'mode', 'level', 'class', 'object', 'item', 'element', 'node', 'list', 'array', 'string', 'number', 'bool', 'true', 'false', 'null', 'void', 'empty', 'full', 'start', 'end', 'begin', 'finish', 'init', 'create', 'update', 'delete', 'remove', 'add', 'insert', 'find', 'search', 'get', 'set', 'put', 'post', 'send', 'recv', 'read', 'write', 'open', 'close', 'save', 'load', 'import', 'export', 'parse', 'encode', 'decode', 'hash', 'sign', 'verify', 'crypt', '.com', 'compress', 'decompress'
        ]);
        
        for (let i = 0; i < this.rawData.length; i++) {
            if (this.byteStates[i] === 'undefined') {
                // Skip if starting with zero bytes
                if (this.rawData[i] === 0) {
                    continue;
                }
                
                let stringLength = 0;
                let hasLetters = false;
                let hasNumbers = false;
                let alphaCount = 0;
                
                for (let j = i; j < this.rawData.length && j < i + 128; j++) {
                    const byte = this.rawData[j];
                    if (byte === 0) break;
                    if (byte < 32 || byte > 126) break;
                    
                    stringLength++;
                    const char = String.fromCharCode(byte);
                    if (/[a-zA-Z]/.test(char)) {
                        hasLetters = true;
                        alphaCount++;
                    } else if (/[0-9]/.test(char)) {
                        hasNumbers = true;
                    }
                }
                
                if (stringLength >= 3 && hasLetters && alphaCount >= stringLength * 0.6) {
                    const stringValue = String.fromCharCode(...this.rawData.slice(i, i + stringLength));
                    const words = stringValue.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3);
                    const knownWords = words.filter(w => commonWords.has(w));
                    
                    let confidence = 0.5;
                    if (knownWords.length > 0) {
                        confidence = 0.7 + (knownWords.length / words.length) * 0.2;
                    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(stringValue)) {
                        confidence = 0.65; // Looks like an identifier
                    } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(stringValue)) {
                        confidence = 0.95; // Email
                    } else if (/^https?:\/\//.test(stringValue)) {
                        confidence = 0.95; // URL
                    } else if (/^[a-fA-F0-9]{8,}$/.test(stringValue)) {
                        confidence = 0.6; // Hex string
                    }
                    
                    if (confidence > 0.6) {
                        this.suggestions.push({
                            type: 'String',
                            range: [i, i + stringLength],
                            value: `"${stringValue}"`,
                            confidence: confidence
                        });
                    }
                }
            }
        }
    }
    
    async detectSolanaAccounts() {
        console.log('Starting Solana account detection...');
        this.showToast('Looking for potential Solana accounts...', 'info', 5000);
        const accountsToCheck = [];
        
        // Collect all potential accounts first
        for (let i = 0; i <= this.rawData.length - 32; i++) {
            if (this.byteStates.slice(i, i + 32).every(state => state === 'undefined')) {
                // Skip if all bytes are zero
                if (this.isAllZeros(i, 32)) {
                    continue;
                }
                
                const pubkeyBytes = this.rawData.slice(i, i + 32);
                
                // Convert directly to base58 and check if it's a valid Solana pubkey format
                try {
                    const pubkeyBase58 = this.bytesToBase58(pubkeyBytes);
                    
                    // Basic validation: Solana pubkeys are 32 bytes = 44 base58 chars (typically)
                    if (pubkeyBase58.length >= 32 && pubkeyBase58.length <= 44 && this.isValidBase58(pubkeyBase58)) {
                        accountsToCheck.push({
                            pubkey: pubkeyBase58,
                            offset: i
                        });
                    }
                } catch (error) {
                    // Skip invalid base58 conversions
                    continue;
                }
            }
        }
        
        console.log(`Found ${accountsToCheck.length} potential Solana accounts to check`);
        
        if (accountsToCheck.length === 0) {
            console.log('No potential Solana accounts found');
            return;
        }
        
        // Choose processing method based on batching setting
        if (this.enableBatching) {
            // Process in batches using batched RPC calls
            const batchSize = 5; // Smaller batch size to be gentler on RPC
            const delayBetweenBatches = 500; // 500ms delay between batches
            
            for (let i = 0; i < accountsToCheck.length; i += batchSize) {
                const batch = accountsToCheck.slice(i, i + batchSize);
                await this.checkSolanaAccountsBatch(batch);
                
                // Add delay between batches if there are more to process
                if (i + batchSize < accountsToCheck.length) {
                    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}, waiting ${delayBetweenBatches}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }
        } else {
            // Process individually for free RPCs that don't support batching
            const delayBetweenCalls = 200; // Small delay between individual calls
            
            for (let i = 0; i < accountsToCheck.length; i++) {
                const account = accountsToCheck[i];
                await this.checkSolanaAccount(account.pubkey, account.offset);
                
                // Add delay between calls if there are more to process
                if (i < accountsToCheck.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
                }
            }
        }
        
        console.log('Solana account detection completed');
        this.showToast('Solana account detection completed', 'success');
    }
    
    async checkSolanaAccountsBatch(accounts, retryCount = 0) {
        const maxRetries = this.solanaRpcUrls.length;
        
        if (retryCount >= maxRetries) {
            console.warn(`Failed to check batch on all RPC endpoints`);
            return;
        }
        
        const currentUrl = this.solanaRpcUrls[retryCount];
        
        try {
            // Create batched RPC request
            const batchRequest = accounts.map((account, index) => ({
                jsonrpc: '2.0',
                id: `batch_${account.offset}_${index}`,
                method: 'getAccountInfo',
                params: [account.pubkey, { encoding: 'base64' }]
            }));
            
            const headers = {
                'Content-Type': 'application/json',
            };
            
            console.log(`Checking batch of ${accounts.length} accounts via ${currentUrl}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.rpcTimeout);
            
            const response = await fetch(currentUrl, {
                method: 'POST',
                mode: 'cors',
                headers: headers,
                body: JSON.stringify(batchRequest),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const batchResults = await response.json();
            
            // Process each result in the batch
            if (Array.isArray(batchResults)) {
                batchResults.forEach((data, index) => {
                    const account = accounts[index];
                    this.processSolanaAccountResult(data, account.pubkey, account.offset, currentUrl);
                });
            } else {
                // Single result case (shouldn't happen with batch, but handle gracefully)
                const account = accounts[0];
                this.processSolanaAccountResult(batchResults, account.pubkey, account.offset, currentUrl);
            }
            
        } catch (error) {
            // Try next RPC endpoint on any fetch errors
            if (retryCount < maxRetries - 1) {
                console.log(`Batch error with ${currentUrl} (${error.message}), trying next endpoint...`);
                return this.checkSolanaAccountsBatch(accounts, retryCount + 1);
            }
            
            // Show toast for final failure
            this.showToast(`RPC batch request failed: ${error.message}`, 'error');
        }
    }
    
    processSolanaAccountResult(data, pubkey, offset, rpcUrl) {
        // Check for RPC errors
        if (data.error) {
            // Don't log common "account not found" errors as they're expected
            if (!data.error.message?.includes('could not find account')) {
                console.warn(`RPC error for ${pubkey} on ${rpcUrl}:`, data.error);
            }
            return;
        }
        
        // Check if account exists and has non-zero lamports
        if (data.result && data.result.value && data.result.value.lamports > 0) {
            const accountInfo = data.result.value;
            const accountDetails = this.analyzeAccountInfo(accountInfo, pubkey);
            
            console.log(`Found valid Solana account: ${pubkey} (${accountDetails.type}) with ${accountInfo.lamports} lamports (via ${rpcUrl})`);
            
            // Calculate confidence based on zero byte count
            const pubkeyBytes = this.rawData.slice(offset, offset + 32);
            const zeroByteCount = pubkeyBytes.filter(byte => byte === 0).length;
            let confidence = 0.95; // Base confidence for verified accounts
            
            if (zeroByteCount <= 20) {
                confidence = 1.0; // Maximum confidence - very likely a real pubkey
            } else {
                confidence = Math.max(0.7, 0.95 - (zeroByteCount - 20) * 0.05); // Reduce confidence for many zeros
            }
            
            this.suggestions.push({
                type: 'Solana Pubkey',
                range: [offset, offset + 32],
                value: pubkey,
                confidence: confidence,
                lamports: accountInfo.lamports,
                accountDetails: accountDetails,
                isMaxConfidence: confidence === 1.0
            });
            
            // Update suggestions immediately when found
            this.renderSuggestions();
            
            // Cache the successful response
            this.accountCache.set(pubkey, {
                accountInfo: accountInfo,
                timestamp: Date.now()
            });
        } else {
            // Cache negative result (account doesn't exist or has 0 lamports)
            this.accountCache.set(pubkey, {
                accountInfo: null,
                timestamp: Date.now()
            });
        }
    }
    
    async checkSolanaAccount(pubkey, offset, retryCount = 0) {
        // Check cache first
        const cacheKey = pubkey;
        const cached = this.accountCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            const cacheAge = Math.round((Date.now() - cached.timestamp) / 1000);
            console.log(`[CACHE HIT] Using cached account data for ${pubkey} (age: ${cacheAge}s)`);
            
            if (cached.accountInfo && cached.accountInfo.lamports > 0) {
                const accountDetails = this.analyzeAccountInfo(cached.accountInfo, pubkey);
                
                // Calculate confidence based on zero byte count
                const pubkeyBytes = this.rawData.slice(offset, offset + 32);
                const zeroByteCount = pubkeyBytes.filter(byte => byte === 0).length;
                let confidence = 0.95;
                
                if (zeroByteCount <= 20) {
                    confidence = 1.0;
                } else {
                    confidence = Math.max(0.7, 0.95 - (zeroByteCount - 20) * 0.05);
                }
                
                this.suggestions.push({
                    type: 'Solana Pubkey',
                    range: [offset, offset + 32],
                    value: pubkey,
                    confidence: confidence,
                    lamports: cached.accountInfo.lamports,
                    accountDetails: accountDetails,
                    isMaxConfidence: confidence === 1.0
                });
                
                this.renderSuggestions();
            }
            return;
        }
        
        const maxRetries = this.solanaRpcUrls.length;
        
        if (retryCount >= maxRetries) {
            console.warn(`Failed to check ${pubkey} on all RPC endpoints`);
            return;
        }
        
        const currentUrl = this.solanaRpcUrls[retryCount];
        
        try {
            const requestBody = {
                jsonrpc: '2.0',
                id: `check_${offset}`,
                method: 'getAccountInfo',
                params: [pubkey, { encoding: 'base64' }]
            };
            
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // Add special headers for CORS proxy
            if (currentUrl.includes('cors-anywhere')) {
                headers['X-Requested-With'] = 'XMLHttpRequest';
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.rpcTimeout);
            
            const response = await fetch(currentUrl, {
                method: 'POST',
                mode: 'cors',
                headers: headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Check for RPC errors
            if (data.error) {
                // Don't log common "account not found" errors as they're expected
                if (!data.error.message?.includes('could not find account')) {
                    console.warn(`RPC error for ${pubkey} on ${currentUrl}:`, data.error);
                }
                return;
            }
            
            // Check if account exists and has non-zero lamports
            if (data.result && data.result.value && data.result.value.lamports > 0) {
                const accountInfo = data.result.value;
                const accountDetails = this.analyzeAccountInfo(accountInfo, pubkey);
                
                console.log(`Found valid Solana account: ${pubkey} (${accountDetails.type}) with ${accountInfo.lamports} lamports (via ${currentUrl})`);
                
                // Calculate confidence based on zero byte count
                const pubkeyBytes = this.rawData.slice(offset, offset + 32);
                const zeroByteCount = pubkeyBytes.filter(byte => byte === 0).length;
                let confidence = 0.95; // Base confidence for verified accounts
                
                if (zeroByteCount <= 20) {
                    confidence = 1.0; // Maximum confidence - very likely a real pubkey
                } else {
                    confidence = Math.max(0.7, 0.95 - (zeroByteCount - 20) * 0.05); // Reduce confidence for many zeros
                }
                
                this.suggestions.push({
                    type: 'Solana Pubkey',
                    range: [offset, offset + 32],
                    value: pubkey,
                    confidence: confidence,
                    lamports: accountInfo.lamports,
                    accountDetails: accountDetails,
                    isMaxConfidence: confidence === 1.0
                });
                
                // Update suggestions immediately when found
                this.renderSuggestions();
                
                // Cache the successful response
                this.accountCache.set(pubkey, {
                    accountInfo: accountInfo,
                    timestamp: Date.now()
                });
                console.log(`[CACHE STORE] Cached account data for ${pubkey} (${accountInfo.lamports} lamports)`);
            } else {
                // Cache negative result (account doesn't exist or has 0 lamports)
                this.accountCache.set(pubkey, {
                    accountInfo: null,
                    timestamp: Date.now()
                });
                console.log(`[CACHE STORE] Cached negative result for ${pubkey} (account not found or 0 lamports)`);
            }
        } catch (error) {
            // Try next RPC endpoint on any fetch errors (including CORS)
            if (retryCount < maxRetries - 1) {
                console.log(`Error with ${currentUrl} (${error.message}), trying next endpoint...`);
                return this.checkSolanaAccount(pubkey, offset, retryCount + 1);
            }
            
            // Show toast for final failure
            this.showToast(`RPC request failed for ${pubkey.substring(0, 8)}...: ${error.message}`, 'error');
        }
    }
    
    analyzeAccountInfo(accountInfo, pubkey) {
        const owner = accountInfo.owner;
        const dataSize = accountInfo.data ? accountInfo.data.length : 0;
        const programName = this.knownPrograms[owner] || 'Unknown Program';
        
        let accountType = 'Unknown Account';
        let details = {};
        
        // System Program accounts
        if (owner === '11111111111111111111111111111111') {
            accountType = 'System Account';
            details.description = 'Native SOL account';
        }
        
        // SPL Token Program accounts
        else if (owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            if (dataSize === this.TOKEN_ACCOUNT_SIZE) {
                accountType = 'SPL Token Account';
                details = this.parseTokenAccount(accountInfo.data);
            } else if (dataSize === this.TOKEN_MINT_SIZE) {
                accountType = 'SPL Token Mint';
                details = this.parseTokenMint(accountInfo.data);
            } else {
                accountType = 'SPL Token Program Account';
            }
        }
        
        // Token-2022 Program accounts
        else if (owner === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') {
            if (dataSize >= this.TOKEN_ACCOUNT_SIZE) {
                accountType = 'Token-2022 Account';
                details = this.parseTokenAccount(accountInfo.data);
            } else if (dataSize >= this.TOKEN_MINT_SIZE) {
                accountType = 'Token-2022 Mint';
                details = this.parseTokenMint(accountInfo.data);
            } else {
                accountType = 'Token-2022 Program Account';
            }
        }
        
        // Squads Multisig accounts
        else if (owner === 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf' || 
                 owner === 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu') {
            accountType = 'Squads Multisig';
            details.description = 'Squads multisig account';
            details.version = owner === 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf' ? 'v3' : 'v4';
        }
        
        // Other known programs
        else if (this.knownPrograms[owner]) {
            accountType = `${programName} Account`;
            details.description = `Account owned by ${programName}`;
        }
        
        return {
            type: accountType,
            owner: owner,
            ownerProgram: programName,
            dataSize: dataSize,
            lamports: accountInfo.lamports,
            executable: accountInfo.executable,
            rentEpoch: accountInfo.rentEpoch,
            ...details
        };
    }
    
    parseTokenAccount(data) {
        try {
            // Parse SPL Token Account structure (simplified)
            // This is a basic implementation - full parsing would require proper borsh deserialization
            if (!data || data.length < this.TOKEN_ACCOUNT_SIZE) {
                return { error: 'Invalid token account data' };
            }
            
            return {
                description: 'SPL Token holding account',
                note: 'Contains token balance and metadata'
            };
        } catch (error) {
            return { error: 'Failed to parse token account' };
        }
    }
    
    parseTokenMint(data) {
        try {
            // Parse SPL Token Mint structure (simplified)
            if (!data || data.length < this.TOKEN_MINT_SIZE) {
                return { error: 'Invalid token mint data' };
            }
            
            return {
                description: 'SPL Token mint authority',
                note: 'Defines token supply and decimals'
            };
        } catch (error) {
            return { error: 'Failed to parse token mint' };
        }
    }
    
    isValidBase58(str) {
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
        return base58Regex.test(str);
    }
    
    bytesToBase58(bytes) {
        return this.base58Encode(bytes);
    }
    
    hexToBase58(hex) {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return this.base58Encode(bytes);
    }
    
    base58Encode(bytes) {
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        
        // Handle empty input
        if (bytes.length === 0) return '';
        
        // Convert bytes to a big integer
        let num = BigInt(0);
        for (const byte of bytes) {
            num = num * BigInt(256) + BigInt(byte);
        }
        
        // Convert to base58
        let encoded = '';
        while (num > 0) {
            const remainder = num % BigInt(58);
            encoded = alphabet[Number(remainder)] + encoded;
            num = num / BigInt(58);
        }
        
        // Handle leading zeros
        for (const byte of bytes) {
            if (byte === 0) {
                encoded = '1' + encoded;
            } else {
                break;
            }
        }
        
        return encoded;
    }
    
    readUInt32LE(offset) {
        return (this.rawData[offset] |
                (this.rawData[offset + 1] << 8) |
                (this.rawData[offset + 2] << 16) |
                (this.rawData[offset + 3] << 24)) >>> 0;
    }
    
    readUInt32BE(offset) {
        return ((this.rawData[offset] << 24) |
                (this.rawData[offset + 1] << 16) |
                (this.rawData[offset + 2] << 8) |
                this.rawData[offset + 3]) >>> 0;
    }
    
    readInt32LE(offset) {
        return this.rawData[offset] |
               (this.rawData[offset + 1] << 8) |
               (this.rawData[offset + 2] << 16) |
               (this.rawData[offset + 3] << 24);
    }
    
    readFloat32LE(offset) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        for (let i = 0; i < 4; i++) {
            view.setUint8(i, this.rawData[offset + i]);
        }
        return view.getFloat32(0, true);
    }
    
    readUInt64LE(offset) {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        for (let i = 0; i < 8; i++) {
            view.setUint8(i, this.rawData[offset + i]);
        }
        return view.getBigUint64(0, true);
    }
    
    readFloat64LE(offset) {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        for (let i = 0; i < 8; i++) {
            view.setUint8(i, this.rawData[offset + i]);
        }
        return view.getFloat64(0, true);
    }
    
    renderSuggestions() {
        const container = document.getElementById('suggestionsList');
        container.innerHTML = '';
        
        // Filter for high-confidence suggestions only
        const smartSuggestions = this.suggestions.filter(s => s.confidence >= 0.7);
        
        if (smartSuggestions.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No high-confidence suggestions found</p>';
            return;
        }
        
        smartSuggestions.sort((a, b) => b.confidence - a.confidence);
        
        smartSuggestions.forEach((suggestion, index) => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.className = 'flex justify-between items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors';
            suggestionDiv.dataset.suggestionIndex = index;
            
            let displayValue = suggestion.value;
            let extraInfo = '';
            
            if (suggestion.lamports) {
                const solAmount = (suggestion.lamports / 1e9).toFixed(2);
                displayValue = `${suggestion.value.substring(0, 8)}...`;
                
                if (suggestion.accountDetails) {
                    extraInfo = `${suggestion.accountDetails.type} • ${solAmount} SOL`;
                } else {
                    extraInfo = `${solAmount} SOL`;
                }
            } else if (displayValue.length > 25) {
                displayValue = displayValue.substring(0, 25) + '...';
            }
            
            // Add confidence indicator
            const confidenceIcon = suggestion.confidence >= 0.9 ? '🔥' : suggestion.confidence >= 0.8 ? '✨' : '💡';
            
            // Store the original suggestion reference for removal
            const originalIndex = this.suggestions.findIndex(s => 
                s.range[0] === suggestion.range[0] && 
                s.range[1] === suggestion.range[1] && 
                s.type === suggestion.type
            );
            
            suggestionDiv.innerHTML = `
                <div class="flex-1 min-w-0 relative">
                    <div class="absolute top-0 right-0 text-xs text-gray-400 font-mono" style="font-size: 9px; line-height: 1;">
                        ${Math.round(suggestion.confidence * 100)}%
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm">${confidenceIcon}</span>
                        <span class="font-medium text-sm text-gray-800">${suggestion.type}</span>
                        <span class="text-xs text-gray-500">@${suggestion.range[0]}</span>
                    </div>
                    <div class="text-xs text-gray-600 truncate">${displayValue}</div>
                    ${extraInfo ? `<div class="text-xs text-blue-600 truncate">${extraInfo}</div>` : ''}
                </div>
                <button class="ml-2 text-gray-400 hover:text-red-500 text-sm font-bold transition-colors" 
                        onclick="event.stopPropagation(); reverseDataTool.removeSuggestion(${originalIndex})" 
                        title="Remove suggestion">
                    ×
                </button>
            `;
            
            suggestionDiv.addEventListener('mouseenter', () => this.highlightRange(suggestion.range[0], suggestion.range[1]));
            suggestionDiv.addEventListener('mouseleave', () => this.unhighlightRange(suggestion.range[0], suggestion.range[1]));
            suggestionDiv.addEventListener('click', () => this.acceptSuggestion(suggestion));
            
            container.appendChild(suggestionDiv);
        });
    }
    
    acceptSuggestion(suggestion) {
        let defaultName = `field_${this.acceptedDecodings.length}`;
        
        // Suggest a better default name based on account type
        if (suggestion.accountDetails) {
            const accountType = suggestion.accountDetails.type.toLowerCase().replace(/\s+/g, '_');
            defaultName = accountType;
        }
        
        const name = prompt('Enter a name for this field:', defaultName);
        if (name === null) return;
        
        for (let i = suggestion.range[0]; i < suggestion.range[1]; i++) {
            this.byteStates[i] = 'decoded';
        }
        
        let displayValue = suggestion.value;
        if (suggestion.accountDetails) {
            displayValue = `${suggestion.value} (${suggestion.accountDetails.type})`;
        }
        
        this.acceptedDecodings.push({
            name: name || defaultName,
            type: suggestion.type,
            range: suggestion.range,
            value: displayValue,
            offset: suggestion.range[0],
            accountDetails: suggestion.accountDetails
        });
        
        // Remove the accepted suggestion from the suggestions list
        const suggestionIndex = this.suggestions.findIndex(s => 
            s.range[0] === suggestion.range[0] && 
            s.range[1] === suggestion.range[1] && 
            s.type === suggestion.type
        );
        if (suggestionIndex > -1) {
            this.suggestions.splice(suggestionIndex, 1);
        }
        
        this.renderHexdump();
        this.updateAcceptedDecodings();
        this.renderSuggestions(); // Re-render suggestions to remove the accepted one
    }
    
    openSolscan(pubkey) {
        window.open(`https://solscan.io/account/${pubkey}`, '_blank');
    }
    
    analyzeAccount(pubkey) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('account', pubkey);
        window.open(currentUrl.toString(), '_blank');
    }
    
    removeSuggestion(index) {
        if (index >= 0 && index < this.suggestions.length) {
            this.suggestions.splice(index, 1);
            this.clearAllHighlights();
            this.renderSuggestions();
        }
    }
    
    clearAllHighlights() {
        // Remove all yellow highlights from hexdump bytes
        document.querySelectorAll('[data-index]').forEach(el => {
            el.classList.remove('bg-yellow-200', 'ring-2', 'ring-yellow-400');
            // Restore green background if this byte is decoded
            const index = parseInt(el.dataset.index);
            if (this.byteStates[index] === 'decoded') {
                el.classList.add('bg-green-200');
            }
        });
        
        // Remove all highlights from accepted decodings
        this.unhighlightAllDecodings();
    }
    
    loadRpcEndpoints() {
        const savedEndpoint = localStorage.getItem('solanaRpcEndpoint');
        if (savedEndpoint) {
            return [savedEndpoint];
        }
        // No default - user must configure
        return [];
    }
    
    loadRpcTimeout() {
        const savedTimeout = localStorage.getItem('rpcTimeout');
        return savedTimeout ? parseInt(savedTimeout) : 5000;
    }
    
    loadBatchingEnabled() {
        const savedBatching = localStorage.getItem('enableBatching');
        return savedBatching !== null ? savedBatching === 'true' : false;
    }
    
    saveRpcSettings(endpoint, timeout, enableBatching) {
        localStorage.setItem('solanaRpcEndpoint', endpoint);
        localStorage.setItem('rpcTimeout', timeout.toString());
        localStorage.setItem('enableBatching', enableBatching.toString());
        
        this.solanaRpcUrls = [endpoint];
        this.rpcTimeout = timeout;
        this.enableBatching = enableBatching;
        
        this.showToast('Settings saved successfully', 'success');
    }
    
    initializeSettingsModal() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        const rpcEndpointInput = document.getElementById('rpcEndpoint');
        
        // Load current settings into inputs
        const currentEndpoint = localStorage.getItem('solanaRpcEndpoint') || '';
        const currentTimeout = localStorage.getItem('rpcTimeout') || '5000';
        const currentBatching = localStorage.getItem('enableBatching') === 'true';
        
        rpcEndpointInput.value = currentEndpoint;
        document.getElementById('rpcTimeout').value = currentTimeout;
        document.getElementById('enableBatching').checked = currentBatching;
        
        // Show modal
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            rpcEndpointInput.focus();
        });
        
        // Hide modal
        const hideModal = () => {
            settingsModal.classList.add('hidden');
        };
        
        closeSettingsBtn.addEventListener('click', hideModal);
        cancelSettingsBtn.addEventListener('click', hideModal);
        
        // Click outside to close
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                hideModal();
            }
        });
        
        // Save settings
        saveSettingsBtn.addEventListener('click', () => {
            const endpoint = rpcEndpointInput.value.trim();
            const timeout = parseInt(document.getElementById('rpcTimeout').value) || 5000;
            const enableBatching = document.getElementById('enableBatching').checked;
            
            if (!endpoint) {
                this.showToast('Please enter an RPC endpoint', 'error');
                return;
            }
            
            // Basic URL validation
            try {
                new URL(endpoint);
            } catch (error) {
                this.showToast('Please enter a valid URL', 'error');
                return;
            }
            
            // Validate timeout
            if (timeout < 1000 || timeout > 30000) {
                this.showToast('Timeout must be between 1000 and 30000ms', 'error');
                return;
            }
            
            this.saveRpcSettings(endpoint, timeout, enableBatching);
            hideModal();
        });
        
        // Clear cache button
        clearCacheBtn.addEventListener('click', () => {
            this.clearAccountCache();
        });
        
        // Enter key to save
        rpcEndpointInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveSettingsBtn.click();
            }
        });
    }
    
    checkFirstTimeSetup() {
        const hasRpcEndpoint = localStorage.getItem('solanaRpcEndpoint');
        
        if (!hasRpcEndpoint) {
            // Show first-time setup modal
            const setupModal = document.getElementById('setupModal');
            const completeSetupBtn = document.getElementById('completeSetupBtn');
            const setupRpcEndpoint = document.getElementById('setupRpcEndpoint');
            const setupRpcTimeout = document.getElementById('setupRpcTimeout');
            const setupEnableBatching = document.getElementById('setupEnableBatching');
            
            setupModal.classList.remove('hidden');
            setupRpcEndpoint.focus();
            
            // Default to public endpoint in the input
            setupRpcEndpoint.value = 'https://api.mainnet-beta.solana.com';
            
            completeSetupBtn.addEventListener('click', () => {
                const endpoint = setupRpcEndpoint.value.trim();
                const timeout = parseInt(setupRpcTimeout.value) || 5000;
                const enableBatching = setupEnableBatching.checked;
                
                if (!endpoint) {
                    this.showToast('Please enter an RPC endpoint', 'error');
                    return;
                }
                
                try {
                    new URL(endpoint);
                } catch (error) {
                    this.showToast('Please enter a valid URL', 'error');
                    return;
                }
                
                if (timeout < 1000 || timeout > 30000) {
                    this.showToast('Timeout must be between 1000 and 30000ms', 'error');
                    return;
                }
                
                this.saveRpcSettings(endpoint, timeout, enableBatching);
                setupModal.classList.add('hidden');
                
                this.showToast('Setup complete! You can now analyze Solana data.', 'success', 4000);
            });
            
            // Enter key to complete setup
            [setupRpcEndpoint, setupRpcTimeout].forEach(input => {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        completeSetupBtn.click();
                    }
                });
            });
        }
    }
    
    async checkPubkeyExists(pubkey, interpretation) {
        try {
            // Check if we have RPC configured
            if (this.solanaRpcUrls.length === 0) {
                interpretation.value = `${pubkey} (configure RPC to check)`;
                interpretation.isChecking = false;
                this.updateSelectionDecode();
                return;
            }
            
            const rpcUrl = this.solanaRpcUrls[0];
            const requestBody = {
                jsonrpc: '2.0',
                id: 'check_pubkey',
                method: 'getAccountInfo',
                params: [pubkey, { encoding: 'base64' }]
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.rpcTimeout);
            
            const response = await fetch(rpcUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                this.handleRpcError(response.status, 'checkPubkeyExists');
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                // Account doesn't exist or other error
                interpretation.value = `${pubkey} (empty account)`;
            } else if (data.result && data.result.value) {
                // Account exists
                const accountInfo = data.result.value;
                const lamports = accountInfo.lamports;
                const solAmount = (lamports / 1e9).toFixed(4);
                const ownerProgram = this.knownPrograms[accountInfo.owner] || 'Unknown Program';
                
                interpretation.value = `${pubkey} (${solAmount} SOL, ${ownerProgram})`;
                interpretation.accountExists = true;
                interpretation.accountInfo = accountInfo;
            } else {
                // Account doesn't exist
                interpretation.value = `${pubkey} (empty account)`;
            }
            
        } catch (error) {
            // On error, just show as empty account
            interpretation.value = `${pubkey} (empty account)`;
        } finally {
            interpretation.isChecking = false;
            this.updateSelectionDecode();
        }
    }
    
    handleRpcError(statusCode, context) {
        let message = '';
        let type = 'error';
        
        switch (statusCode) {
            case 401:
                message = 'RPC Authentication failed. Your endpoint may not support batched requests - try disabling batching in settings.';
                type = 'warning';
                break;
            case 429:
                message = 'Rate limit exceeded. Too many requests to RPC endpoint. Try increasing timeout or using a different endpoint.';
                type = 'warning';
                break;
            case 403:
                message = 'RPC access forbidden. Check your API key or endpoint permissions.';
                break;
            case 500:
                message = 'RPC server error. The endpoint may be experiencing issues.';
                break;
            case 502:
            case 503:
            case 504:
                message = 'RPC endpoint unavailable. Try using a different endpoint.';
                break;
            default:
                message = `RPC request failed with status ${statusCode}`;
        }
        
        this.showToast(message, type);
    }
    
    isMaxConfidenceByte(index) {
        return this.suggestions.some(suggestion => 
            suggestion.isMaxConfidence && 
            index >= suggestion.range[0] && 
            index < suggestion.range[1]
        );
    }
    
    highlightMaxConfidenceSuggestions() {
        // Re-render hexdump to apply max confidence highlighting
        this.renderHexdump();
    }
    
    acceptMaxConfidenceSuggestion(clickedIndex) {
        // Find the max confidence suggestion that contains this byte
        const suggestion = this.suggestions.find(s => 
            s.isMaxConfidence && 
            clickedIndex >= s.range[0] && 
            clickedIndex < s.range[1]
        );
        
        if (suggestion) {
            this.acceptSuggestion(suggestion);
        }
    }
}

let reverseDataTool;

document.addEventListener('DOMContentLoaded', () => {
    reverseDataTool = new ReverseDataTool();
    
    // Check URL parameters after DOM and tool are ready
    reverseDataTool.checkUrlParameters();
});
