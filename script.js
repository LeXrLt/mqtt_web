document.addEventListener('DOMContentLoaded', () => {
    const registrationCodeInput = document.getElementById('registrationCode');
    const alarmCodeSelect = document.getElementById('alarmCode');
    const pushButton = document.getElementById('pushButton');
    const registrationCodeError = document.getElementById('registrationCodeError');

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

        const baseUrl = 'https://mqtt-web.ti-lian.com/local/v1/media/addAlarm';
        const queryParams = `?registerNumber=${encodeURIComponent(registerNumber)}&alarmType=${encodeURIComponent(alarmType)}`;
        const fullUrl = baseUrl + queryParams;

        console.log('Sending request to:', fullUrl); // For debugging

        fetch(fullUrl)
            .then(response => {
                if (!response.ok) {
                    // Try to get error message from response body if possible
                    return response.text().then(text => {
                        throw new Error(`网络响应错误: ${response.status} ${response.statusText}. ${text ? 'Details: ' + text : ''}`);
                    });
                }
                return response.json(); // Or response.text() if not expecting JSON
            })
            .then(data => {
                console.log('Success:', data);
                alert('告警已成功推送！'); // Simple success feedback
            })
            .catch(error => {
                console.error('Error:', error);
                alert(`推送失败: ${error.message}`); // Simple error feedback
            });
    }
});
