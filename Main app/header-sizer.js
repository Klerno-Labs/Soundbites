(function(){
  function applySignatureRatiosCommon(root){
    const logo = root.querySelector?.('.brand-logo') || document.querySelector('.brand-logo');
    const wave = root.querySelector?.('.wave-graphic') || document.querySelector('.wave-graphic');
    const play = root.querySelector?.('.play-button-accent') || document.querySelector('.play-button-accent');
    if (!logo) return;

    const container = document.querySelector('header') || document.body;
    const maxWidth = Math.min((container?.clientWidth || 800), 800);
    const unit = Math.max(40, Math.floor(maxWidth / 10));

    const cs = getComputedStyle(document.documentElement);
    const logoUnitMult = parseFloat(cs.getPropertyValue('--sb-logo-unit-multiplier')) || 5.0;
    const waveWidthMult = parseFloat(cs.getPropertyValue('--sb-wave-width-multiplier')) || 2.0;
    const waveHeightMult = parseFloat(cs.getPropertyValue('--sb-wave-height-multiplier')) || 0.25;
    const playSizeMult = parseFloat(cs.getPropertyValue('--sb-play-size-multiplier')) || 0.35;

    const logoWidth = Math.round(unit * logoUnitMult);
    logo.style.width = logoWidth + 'px';
    logo.style.height = 'auto';

    const measuredLogoHeight = logo.clientHeight || (logoWidth * 0.2);
    if (wave) {
      const waveWidth = Math.round(logoWidth * waveWidthMult);
      wave.style.width = waveWidth + 'px';
      const waveHeight = Math.max(1, Math.round(measuredLogoHeight * waveHeightMult));
      wave.style.height = waveHeight + 'px';
    }

    // Spacing is now controlled via CSS tokens in brand.css; avoid injecting margins here.
    const header = document.querySelector('header');
    if (header) header.style.textAlign = 'center';

    if (play) {
      const playSize = Math.round(measuredLogoHeight * playSizeMult);
      // Expose desired size via CSS var; CSS will clamp to min touch target
      document.documentElement.style.setProperty('--sb-play-size', playSize + 'px');
    }
  }

  function initHeaderSizer(){
    const apply = () => applySignatureRatiosCommon(document);
    window.addEventListener('resize', apply);
    document.addEventListener('DOMContentLoaded', () => {
      apply();
      const logo = document.querySelector('.brand-logo');
      const wave = document.querySelector('.wave-graphic');
      if (logo && !logo.complete) logo.addEventListener('load', apply, { once: true });
      if (wave && !wave.complete) wave.addEventListener('load', apply, { once: true });
    });
  }

  window.applySignatureRatiosCommon = applySignatureRatiosCommon;
  window.initHeaderSizer = initHeaderSizer;
})();
