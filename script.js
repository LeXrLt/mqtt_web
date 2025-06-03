document.addEventListener('DOMContentLoaded', () => {
    const registrationCodeInput = document.getElementById('registrationCode');
    const alarmCodeSelect = document.getElementById('alarmCode');
    const pushButton = document.getElementById('pushButton');
    const registrationCodeError = document.getElementById('registrationCodeError');

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
        localStorage.setItem(REGISTRATION_CODE_KEY, registrationCodeInput.value);
    });

    alarmCodeSelect.addEventListener('change', () => {
        localStorage.setItem(ALARM_CODE_KEY, alarmCodeSelect.value);
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
