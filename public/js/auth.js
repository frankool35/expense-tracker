
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const nameField = document.getElementById('nameField');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordHelp = document.getElementById('passwordHelp');
const submitButton = document.getElementById('submitButton');
const switchText = document.getElementById('switchText');
const switchMode = document.getElementById('switchMode');
const authMessage = document.getElementById('authMessage');

let isRegistering = false;

function showMessage(message, type = 'error') {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
}

function clearMessage() {
    authMessage.textContent = '';
    authMessage.className = 'auth-message';
}

function updateFormMode() {
    clearMessage();

    nameField.hidden = !isRegistering;
    nameInput.required = isRegistering;

    authTitle.textContent = isRegistering
        ? 'Create your account'
        : 'Welcome back';

    authSubtitle.textContent = isRegistering
        ? 'Start managing your money with confidence.'
        : 'Sign in to manage your finances.';

    submitButton.textContent = isRegistering
        ? 'Create Account'
        : 'Sign In';

    switchText.textContent = isRegistering
        ? 'Already have an account?'
        : "Don't have an account?";

    switchMode.textContent = isRegistering
        ? 'Sign in'
        : 'Create one';

    passwordInput.autocomplete = isRegistering
        ? 'new-password'
        : 'current-password';

    passwordHelp.textContent = isRegistering
        ? 'Use at least 8 characters.'
        : 'Enter your password.';
}

switchMode.addEventListener('click', () => {
    isRegistering = !isRegistering;
    updateFormMode();
});

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (isRegistering && !name) {
        showMessage('Please enter your full name.');
        nameInput.focus();
        return;
    }

    if (password.length < 8) {
        showMessage('Your password must contain at least 8 characters.');
        passwordInput.focus();
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = isRegistering
        ? 'Creating account...'
        : 'Signing in...';

    try {
        const endpoint = isRegistering
            ? '/api/auth/register'
            : '/api/auth/login';

        const payload = isRegistering
            ? { name, email, password }
            : { email, password };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            showMessage(result.message || 'Something went wrong. Please try again.');
            return;
        }

        showMessage(
            isRegistering
                ? 'Account created successfully. Opening your dashboard...'
                : 'Login successful. Opening your dashboard...',
            'success'
        );

        window.location.assign('/');
    } catch (error) {
        showMessage(
            'Unable to connect to the server. Check that the application is running.'
        );
    } finally {
        submitButton.disabled = false;
        updateSubmitButton();
    }
});

function updateSubmitButton() {
    submitButton.textContent = isRegistering
        ? 'Create Account'
        : 'Sign In';
}

async function checkExistingSession() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'same-origin',
        });

        if (response.ok) {
            window.location.replace('/');
        }
    } catch (error) {
        // The form remains available if the session check fails.
    }
}

updateFormMode();
checkExistingSession();
