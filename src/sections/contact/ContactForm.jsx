import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import checkIcon from '../../assets/img/check.svg'
import { consentTextKey } from '../../data/contact'
import {
    clearSubmitState,
    setConsent,
    setField,
    submitContactForm,
} from './contactFormSlice'
import { useTranslation } from 'react-i18next'

export function ContactForm({ submitLabelKey = 'contact.form.submit' }) {
    const dispatch = useDispatch()
    const { t } = useTranslation()

    const values = useSelector((s) => s.contactForm.values)
    const auth = useSelector((s) => s.contactForm.auth)
    const errors = useSelector((s) => s.contactForm.errors)
    const status = useSelector((s) => s.contactForm.status)
    const successMessageKey = useSelector((s) => s.contactForm.successMessageKey)
    const submitErrorMessageKey = useSelector((s) => s.contactForm.submitErrorMessageKey)

    const isLoading = status === 'loading'
    const hasProfileAccess = Boolean(auth.formId && auth.login && auth.password && auth.profileUrl)

    const onChangeField = useCallback(
        (field) => (e) => {
            dispatch(clearSubmitState())
            dispatch(setField({ field, value: e.target.value }))
        },
        [dispatch],
    )

    const onChangeConsent = useCallback(
        (e) => {
            dispatch(clearSubmitState())
            dispatch(setConsent(e.target.checked))
        },
        [dispatch],
    )

    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault()
            dispatch(submitContactForm())
        },
        [dispatch],
    )

    return (
        <form className="contact__form" onSubmit={handleSubmit} noValidate>
            <label className={`contact__field ${errors.name ? 'contact__field--error' : ''}`}>
                <input
                    type="text"
                    name="name"
                    placeholder={t('contact.form.placeholders.name')}
                    value={values.name}
                    onChange={onChangeField('name')}
                />
            </label>
            {errors.name && <p className="contact__error">{t(errors.name)}</p>}

            <label className={`contact__field ${errors.phone ? 'contact__field--error' : ''}`}>
                <input
                    type="tel"
                    name="phone"
                    placeholder={t('contact.form.placeholders.phone')}
                    value={values.phone}
                    onChange={onChangeField('phone')}
                />
            </label>
            {errors.phone && <p className="contact__error">{t(errors.phone)}</p>}

            <label className={`contact__field ${errors.email ? 'contact__field--error' : ''}`}>
                <input
                    type="email"
                    name="email"
                    placeholder={t('contact.form.placeholders.email')}
                    value={values.email}
                    onChange={onChangeField('email')}
                />
            </label>
            {errors.email && <p className="contact__error">{t(errors.email)}</p>}

            <label className="contact__field contact__field--textarea">
                <textarea
                    name="comment"
                    rows="3"
                    placeholder={t('contact.form.placeholders.comment')}
                    value={values.comment}
                    onChange={onChangeField('comment')}
                />
            </label>

            <label className={`contact__checkbox ${errors.consent ? 'contact__checkbox--error' : ''}`}>
                <input
                    type="checkbox"
                    name="consent"
                    checked={values.consent}
                    onChange={onChangeConsent}
                />
                <span className="contact__checkbox-box">
                    <img src={checkIcon} alt="" />
                </span>
                <span className="contact__checkbox-label">{t(consentTextKey)}</span>
            </label>
            {errors.consent && <p className="contact__error">{t(errors.consent)}</p>}

            <button type="submit" className="contact__submit" disabled={isLoading}>
                {isLoading ? t('contact.form.sending') : t(submitLabelKey)}
            </button>

            {status === 'success' && (
                <p className="contact__success">{t(successMessageKey || 'contact.form.successCreated')}</p>
            )}
            {hasProfileAccess && (
                <div className="contact__success">
                    <p>{t('contact.form.editMode')}</p>
                    <p>
                        {t('contact.form.profileUrl')}: <a href={auth.profileUrl}>{auth.profileUrl}</a>
                    </p>
                    <p>
                        {t('contact.form.login')}: <strong>{auth.login}</strong>
                    </p>
                    <p>
                        {t('contact.form.password')}: <strong>{auth.password}</strong>
                    </p>
                </div>
            )}
            {status === 'error' && (
                <p className="contact__error">{t(submitErrorMessageKey || 'contact.form.errors.submitFailed')}</p>
            )}
        </form>
    )
}
