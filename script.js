document.addEventListener('DOMContentLoaded', async () => {
    const ARM_DATA_CACHE_KEY = 'armDataCache';
    const ARM_DATA_CACHE_TIMESTAMP_KEY = 'armDataCacheTimestamp';
    const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
    let allArms = []; // To store the fetched arm data

    const registrationCodeInput = document.getElementById('registrationCode');
    const alarmCodeSelect = document.getElementById('alarmCode');
    const pushButton = document.getElementById('pushButton');
    const registrationCodeError = document.getElementById('registrationCodeError');
    const autocompleteList = document.getElementById('autocomplete-list');
    // Ensure this element exists in index.html as per plan step 4, or create it dynamically if preferred.
    // For this subtask, we assume it exists.


    function displaySuggestions(suggestions) {
        if (!autocompleteList) return; // Guard if element not found
        autocompleteList.innerHTML = ''; // Clear previous suggestions

        if (suggestions.length === 0) {
            autocompleteList.style.display = 'none';
            return;
        }

        suggestions.slice(0, 10).forEach(item => { // Limit to 10 suggestions
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'autocomplete-suggestion-item'; // For styling
            // Format: {elevatorName}|{registerCode后四位}
            const lastFourDigits = item.registerCode.slice(-4);
            suggestionItem.textContent = `${item.elevatorName}|${lastFourDigits}`;
            suggestionItem.dataset.registerCode = item.registerCode; // Store full code

            suggestionItem.addEventListener('click', () => {
                registrationCodeInput.value = item.registerCode;
                localStorage.setItem(REGISTRATION_CODE_KEY, item.registerCode); // Explicitly save to cache
                autocompleteList.innerHTML = '';
                autocompleteList.style.display = 'none';
                registrationCodeInput.focus(); // Optional: keep focus on input
            });
            autocompleteList.appendChild(suggestionItem);
        });
        autocompleteList.style.display = 'block';
    }


    async function fetchAndCacheArmData() {
        const cachedData = localStorage.getItem(ARM_DATA_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(ARM_DATA_CACHE_TIMESTAMP_KEY);

        if (cachedData && cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < CACHE_DURATION_MS) {
            console.log('Loading arm data from cache.');
            allArms = JSON.parse(cachedData);
            // Potentially trigger rendering of dependent elements if any were waiting for this data
            return Promise.resolve(); // Indicate data is ready
        }

        console.log('Fetching arm data from API...');
        try {
            const response = await fetch('https://mqtt-web.ti-lian.com/local/v1/arm/findArmAll');
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const result = await response.json(); // This API returns JSON directly according to user

            if (result.code === "200" && result.data) {
                allArms = result.data;
                localStorage.setItem(ARM_DATA_CACHE_KEY, JSON.stringify(allArms));
                localStorage.setItem(ARM_DATA_CACHE_TIMESTAMP_KEY, Date.now().toString());
                console.log('Arm data fetched and cached.');
            } else {
                throw new Error(`API returned code ${result.code || 'unknown'} or no data: ${result.msg || 'No message'}`);
            }
        } catch (error) {
            console.error('Error fetching or caching arm data:', error);
            showToast(`获取注册码列表失败: ${error.message}`, 'error');
            // If cache exists but is stale, maybe still use it? For now, we clear it.
            allArms = []; // Reset or use stale data if preferred.
            localStorage.removeItem(ARM_DATA_CACHE_KEY); // Clear potentially corrupt/stale cache
            localStorage.removeItem(ARM_DATA_CACHE_TIMESTAMP_KEY);
            // Optional: try to load stale cache if API fails
            // if (cachedData) {
            //    console.warn('Using stale arm data due to API fetch failure.');
            //    allArms = JSON.parse(cachedData);
            // }
        }
    }

    function showToast(message, type = 'info') { // type can be 'info', 'success', 'error'
        const toast = document.createElement('div');
        toast.className = `toast ${type}`; // e.g., toast success, toast error
        toast.textContent = message;

        document.body.appendChild(toast);

        // Trigger reflow to enable animation
        toast.offsetHeight;

        // Make it visible and start fade out timer
        toast.style.opacity = 1;

        setTimeout(() => {
            toast.style.opacity = 0;
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500); // Matches CSS transition time
        }, 2500); // Toast visible for 2.5 seconds before starting fade
    }

    const REGISTRATION_CODE_KEY = 'registrationCodeCache';
    const ALARM_CODE_KEY = 'alarmCodeCache';

    await fetchAndCacheArmData(); // Wait for it if subsequent steps depend on allArms immediately

    // Populate Alarm Code Dropdown
    const alarmOptions = [
        { text: '电动车', value: 200 },
        { text: '消除告警', value: 0 }
    ];

    alarmOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.textContent = option.text;
        opt.value = option.value;
        alarmCodeSelect.appendChild(opt);
    });

    // Load cached values
    const cachedRegistrationCode = localStorage.getItem(REGISTRATION_CODE_KEY);
    if (cachedRegistrationCode) {
        registrationCodeInput.value = cachedRegistrationCode;
    }

    const cachedAlarmCode = localStorage.getItem(ALARM_CODE_KEY);
    if (cachedAlarmCode) {
        alarmCodeSelect.value = cachedAlarmCode;
    }

    // Event Listeners for caching
    registrationCodeInput.addEventListener('input', () => {
        // Existing localStorage saving logic for registrationCodeInput should still be here or integrated.
        // For this subtask, we assume it's separate or we re-add it if it was removed.
        // The click handler in displaySuggestions already saves to localStorage.
        // This event listener is now primarily for triggering search.
        localStorage.setItem(REGISTRATION_CODE_KEY, registrationCodeInput.value);


        const inputValue = registrationCodeInput.value.toLowerCase().trim();

        if (inputValue.length < 1) { // Minimum characters to trigger search, e.g., 1 or 2
            if (autocompleteList) {
                autocompleteList.innerHTML = '';
                autocompleteList.style.display = 'none';
            }
            return;
        }

        if (allArms && allArms.length > 0) {
            const filteredArms = allArms.filter(arm => {
                return arm.elevatorName.toLowerCase().includes(inputValue) ||
                       arm.registerCode.toLowerCase().includes(inputValue);
            });
            displaySuggestions(filteredArms);
        }
    });

    alarmCodeSelect.addEventListener('change', () => {
        localStorage.setItem(ALARM_CODE_KEY, alarmCodeSelect.value);
    });

    // Global click listener to hide autocomplete list
    document.addEventListener('click', (e) => {
        if (e.target !== registrationCodeInput && (!autocompleteList || e.target.parentNode !== autocompleteList)) {
            if (autocompleteList) { // Check if autocompleteList exists
              autocompleteList.style.display = 'none';
            }
        }
    });

    // Event Listener for Push Button
    pushButton.addEventListener('click', () => {
        if (validateInput()) {
            sendApiRequest();
        }
    });

    // Input Validation Function
    function validateInput() {
        let isValid = true;
        // Clear previous errors
        registrationCodeError.textContent = '';

        // Validate Registration Code (approx. 20 chars)
        // Allowing a range, e.g., 15-25 chars for "approximately 20"
        if (registrationCodeInput.value.length < 15 || registrationCodeInput.value.length > 25) {
            registrationCodeError.textContent = '注册编码长度应在15到25位之间。';
            isValid = false;
        }
        // Basic check for empty string just in case, though length check covers it
        if (registrationCodeInput.value.trim() === '') {
            registrationCodeError.textContent = '注册编码不能为空。';
            isValid = false;
        }


        return isValid;
    }

    // API Request Function
    function sendApiRequest() {
        const registerNumber = registrationCodeInput.value;
        const alarmType = alarmCodeSelect.value;

        const baseUrl = 'https://mqtt-web.ti-lian.com/local/v1/media/addAlarm'; // Corrected URL from previous fix
        const queryParams = `?registerNumber=${encodeURIComponent(registerNumber)}&alarmType=${encodeURIComponent(alarmType)}`;
        const fullUrl = baseUrl + queryParams;

        console.log('Sending request to:', fullUrl);

        fetch(fullUrl)
            .then(response => {
                if (response.status === 200) {
                    // No need to parse JSON for success, just check status
                    return { success: true, status: response.status }; // Return a simple success object
                } else {
                    // Try to get text for error message, but don't fail if it's not there
                    return response.text().then(text => {
                        throw new Error(`网络响应错误: ${response.status} ${response.statusText}.${text ? '详情: ' + text : ''}`);
                    }).catch(() => {
                        // Fallback if response.text() itself fails or if there's no text
                        throw new Error(`网络响应错误: ${response.status} ${response.statusText}.`);
                    });
                }
            })
            .then(data => {
                // 'data' will be our { success: true } object if successful
                if (data.success) {
                    console.log('Success: Status 200');
                    showToast('告警已成功推送！', 'success');
                }
                // No 'else' here because errors are caught in .catch
            })
            .catch(error => {
                console.error('Error:', error);
                showToast(`推送失败: ${error.message}`, 'error');
            });
    }
});
