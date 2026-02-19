import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const API_BASE_URL = String(import.meta.env.VITE_BACKEND_URL || 'http://localhost:18085').replace(
    /\/+$/,
    '',
)
const AUTH_STORAGE_KEY = 'drupal_contact_form_auth'

const isValidPhone = (value) => /^\+?[0-9\s\-()]{7,}$/.test(value)
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)

const emptyErrors = () => ({ name: '', phone: '', email: '', consent: '' })
const emptyAuth = () => ({ formId: null, login: '', password: '', profileUrl: '' })

function validate(values) {
    const errors = emptyErrors()

    if (!String(values.name || '').trim()) errors.name = 'contact.form.errors.nameRequired'
    if (!isValidPhone(String(values.phone || '').trim()))
        errors.phone = 'contact.form.errors.phoneInvalid'
    if (!isValidEmail(String(values.email || '').trim()))
        errors.email = 'contact.form.errors.emailInvalid'
    if (!values.consent) errors.consent = 'contact.form.errors.consentRequired'

    return errors
}

function hasErrors(errors) {
    return Boolean(errors.name || errors.phone || errors.email || errors.consent)
}

function parseFormIdFromProfileUrl(profileUrl) {
    const match = String(profileUrl || '').match(/\/api\/forms\/(\d+)\s*$/)
    if (!match) return null

    const parsed = Number.parseInt(match[1], 10)
    return Number.isNaN(parsed) ? null : parsed
}

function loadStoredAuth() {
    if (typeof window === 'undefined') return emptyAuth()

    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
        if (!raw) return emptyAuth()

        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return emptyAuth()

        const formId = Number.parseInt(parsed.formId, 10)
        if (Number.isNaN(formId)) return emptyAuth()

        const login = String(parsed.login || '').trim()
        const password = String(parsed.password || '').trim()
        if (!login || !password) return emptyAuth()

        return {
            formId,
            login,
            password,
            profileUrl: String(parsed.profileUrl || ''),
        }
    } catch {
        return emptyAuth()
    }
}

function saveStoredAuth(auth) {
    if (typeof window === 'undefined') return

    const safeAuth = {
        formId: auth.formId,
        login: auth.login,
        password: auth.password,
        profileUrl: auth.profileUrl,
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeAuth))
}

function clearStoredAuth() {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

function normalizeServerErrors(errors) {
    return {
        name: String(errors?.name || ''),
        phone: String(errors?.phone || ''),
        email: String(errors?.email || ''),
        consent: String(errors?.consent || ''),
    }
}

function normalizeValues(values) {
    return {
        name: String(values.name || '').trim(),
        phone: String(values.phone || '').trim(),
        email: String(values.email || '').trim(),
        comment: String(values.comment || '').trim(),
        consent: Boolean(values.consent),
    }
}

async function parseJsonSafe(response) {
    try {
        return await response.json()
    } catch {
        return null
    }
}

export const submitContactForm = createAsyncThunk(
    'contactForm/submit',
    async (_, { getState, rejectWithValue }) => {
        const { values, auth } = getState().contactForm
        const normalizedValues = normalizeValues(values)

        const errors = validate(normalizedValues)
        if (hasErrors(errors)) {
            return rejectWithValue({ kind: 'validation', errors })
        }

        const isAuthorized = Boolean(auth.formId && auth.login && auth.password)
        const url = isAuthorized
            ? `${API_BASE_URL}/api/forms/${auth.formId}`
            : `${API_BASE_URL}/api/forms`

        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        }

        if (isAuthorized) {
            headers.Authorization = `Basic ${window.btoa(`${auth.login}:${auth.password}`)}`
        }

        try {
            const res = await fetch(url, {
                method: isAuthorized ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify(normalizedValues),
            })

            const payload = await parseJsonSafe(res)

            if (!res.ok) {
                if (res.status === 422 && payload?.errors) {
                    return rejectWithValue({
                        kind: 'validation',
                        errors: normalizeServerErrors(payload.errors),
                    })
                }

                if (res.status === 401 || res.status === 403) {
                    clearStoredAuth()
                    return rejectWithValue({
                        kind: 'auth',
                        messageKey: 'contact.form.errors.authFailed',
                    })
                }

                return rejectWithValue({
                    kind: 'network',
                    messageKey: 'contact.form.errors.submitFailed',
                })
            }

            const form = payload?.form || {}
            const profileUrl = String(payload?.profileUrl || form.profileUrl || auth.profileUrl || '')

            if (isAuthorized) {
                const updatedAuth = {
                    ...auth,
                    profileUrl,
                }
                saveStoredAuth(updatedAuth)

                return {
                    mode: 'updated',
                    form,
                    auth: updatedAuth,
                }
            }

            const createdAuth = {
                formId: Number(form.id) || parseFormIdFromProfileUrl(profileUrl),
                login: String(payload?.credentials?.login || ''),
                password: String(payload?.credentials?.password || ''),
                profileUrl,
            }

            if (createdAuth.formId && createdAuth.login && createdAuth.password) {
                saveStoredAuth(createdAuth)
            }

            return {
                mode: 'created',
                form,
                auth: createdAuth,
            }
        } catch {
            return rejectWithValue({
                kind: 'network',
                messageKey: 'contact.form.errors.submitFailed',
            })
        }
    },
)

const storedAuth = loadStoredAuth()

export const contactFormInitialState = {
    values: {
        name: '',
        phone: '',
        email: '',
        comment: '',
        consent: true,
    },
    auth: storedAuth,
    errors: emptyErrors(),
    status: 'idle', // idle | loading | success | error | invalid
    successMessageKey: '',
    submitErrorMessageKey: '',
}

const contactFormSlice = createSlice({
    name: 'contactForm',
    initialState: contactFormInitialState,
    reducers: {
        setField(state, action) {
            const { field, value } = action.payload
            state.values[field] = value
            if (state.errors[field] !== undefined) state.errors[field] = ''
            if (state.status === 'success') state.status = 'idle'
        },
        setConsent(state, action) {
            state.values.consent = Boolean(action.payload)
            state.errors.consent = ''
            if (state.status === 'success') state.status = 'idle'
        },
        clearSubmitState(state) {
            state.status = 'idle'
            state.successMessageKey = ''
            state.submitErrorMessageKey = ''
        },
        clearSavedProfileAuth(state) {
            state.auth = emptyAuth()
            clearStoredAuth()
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(submitContactForm.pending, (state) => {
                state.status = 'loading'
                state.successMessageKey = ''
                state.submitErrorMessageKey = ''
            })
            .addCase(submitContactForm.fulfilled, (state, action) => {
                const payload = action.payload

                state.status = 'success'
                state.errors = emptyErrors()
                state.submitErrorMessageKey = ''
                state.successMessageKey =
                    payload?.mode === 'updated'
                        ? 'contact.form.successUpdated'
                        : 'contact.form.successCreated'

                if (payload?.form) {
                    state.values.name = String(payload.form.name || state.values.name || '')
                    state.values.phone = String(payload.form.phone || state.values.phone || '')
                    state.values.email = String(payload.form.email || state.values.email || '')
                    state.values.comment = String(payload.form.comment || state.values.comment || '')
                    state.values.consent = Boolean(payload.form.consent ?? state.values.consent)
                }

                if (payload?.auth?.formId && payload?.auth?.login && payload?.auth?.password) {
                    state.auth = payload.auth
                }
            })
            .addCase(submitContactForm.rejected, (state, action) => {
                const payload = action.payload
                if (payload?.kind === 'validation') {
                    state.status = 'invalid'
                    state.errors = payload.errors
                    state.successMessageKey = ''
                    state.submitErrorMessageKey = ''
                    return
                }

                if (payload?.kind === 'auth') {
                    state.auth = emptyAuth()
                }

                state.status = 'error'
                state.successMessageKey = ''
                state.submitErrorMessageKey =
                    payload?.messageKey || 'contact.form.errors.submitFailed'
            })
    },
})

export const { setField, setConsent, clearSubmitState, clearSavedProfileAuth } =
    contactFormSlice.actions
export const contactFormReducer = contactFormSlice.reducer
