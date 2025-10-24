/**
 * FDA DSHEA-Compliant Disclaimer Component
 * Must be displayed wherever structure/function claims appear
 */

function createSupplementDisclaimer(accent = '#C92A76') {
    const disclaimer = document.createElement('div');
    disclaimer.className = 'supplement-disclaimer';
    disclaimer.style.cssText = `
        margin-top: 2rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid ${accent};
        border-radius: 10px;
        font-size: 0.85rem;
        line-height: 1.6;
        color: #333;
        text-align: left;
        max-width: 100%;
        word-wrap: break-word;
        overflow-wrap: break-word;
    `;

    // Mobile-responsive padding
    if (window.innerWidth <= 768) {
        disclaimer.style.padding = '1rem';
        disclaimer.style.fontSize = '0.8rem';
    }

    disclaimer.innerHTML = `
        <strong style="display: block; margin-bottom: 0.5rem; color: ${accent}; word-wrap: break-word;">
            ⚠️ Important Information
        </strong>
        <p style="margin: 0; word-wrap: break-word; overflow-wrap: break-word;">
            *These statements have not been evaluated by the Food and Drug Administration.
            This product is not intended to diagnose, treat, cure, or prevent any disease.
            This quiz provides personalized product recommendations based on your responses
            and is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
    `;

    return disclaimer;
}

window.createSupplementDisclaimer = createSupplementDisclaimer;
