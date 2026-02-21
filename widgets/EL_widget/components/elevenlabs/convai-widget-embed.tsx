'use client';

import * as React from 'react';

const EMBED_SCRIPT_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
const WIDGET_TAG_NAME = 'elevenlabs-convai';
const CALL_EVENT_NAME = 'elevenlabs-convai:call';
const EXPAND_EVENT_NAME = 'elevenlabs-agent:expand';
const INPUT_TUNED_ATTR = 'data-codex-input-tuned';
const INPUT_BASE_MIN_HEIGHT_ATTR = 'data-codex-input-base-min-height';
const INPUT_BASE_HEIGHT_ATTR = 'data-codex-input-base-height';
const INPUT_BASE_PADDING_TOP_ATTR = 'data-codex-input-base-padding-top';
const INPUT_BASE_PADDING_BOTTOM_ATTR = 'data-codex-input-base-padding-bottom';
const POWERED_BY_ELEVENLABS_PATTERN = /powered\s+by\s+elevenlabs\s+agents?/i;

type WidgetVariant = 'tiny' | 'compact' | 'full' | 'expanded';
type ExpandAction = 'expand' | 'collapse' | 'toggle';

type ThemeColorKey =
  | 'base'
  | 'baseHover'
  | 'baseActive'
  | 'baseBorder'
  | 'baseSubtle'
  | 'basePrimary'
  | 'baseError'
  | 'accent'
  | 'accentHover'
  | 'accentActive'
  | 'accentBorder'
  | 'accentSubtle'
  | 'accentPrimary';

const themeColorCssVariableMap: Record<ThemeColorKey, string> = {
  base: '--el-base',
  baseHover: '--el-base-hover',
  baseActive: '--el-base-active',
  baseBorder: '--el-base-border',
  baseSubtle: '--el-base-subtle',
  basePrimary: '--el-base-primary',
  baseError: '--el-base-error',
  accent: '--el-accent',
  accentHover: '--el-accent-hover',
  accentActive: '--el-accent-active',
  accentBorder: '--el-accent-border',
  accentSubtle: '--el-accent-subtle',
  accentPrimary: '--el-accent-primary',
};

export type ConvAIWidgetThemeColors = Partial<Record<ThemeColorKey, string>>;

declare global {
  interface Window {
    __elConvaiScriptLoading?: Promise<void>;
  }
}

export interface ConvAIWidgetEmbedProps {
  agentId: string;
  variant?: WidgetVariant;
  dismissible?: boolean;
  serverLocation?: string;
  actionText?: string;
  startCallText?: string;
  endCallText?: string;
  expandText?: string;
  listeningText?: string;
  speakingText?: string;
  avatarImageUrl?: string;
  avatarOrbColor1?: string;
  avatarOrbColor2?: string;
  dynamicVariables?: Record<string, string>;
  overrideLanguage?: string;
  overridePrompt?: string;
  overrideFirstMessage?: string;
  overrideVoiceId?: string;
  themeColors?: ConvAIWidgetThemeColors;
  secondaryLogoUrl?: string;
  secondaryLogoAlt?: string;
  secondaryLogoSize?: number;
  secondaryLogoOffsetX?: number;
  secondaryLogoOffsetY?: number;
  secondaryLogoRounded?: boolean;
  secondaryLogoShadow?: boolean;
  providerText?: string;
  providerUrl?: string;
  providerIconUrl?: string;
  providerIconSize?: number;
  providerColor?: string;
  providerFontSize?: number;
  providerOffsetY?: number;
  poweredByTextOverride?: string;
  orbDebug?: boolean;
  inputBoxShrinkPx?: number;
  inputTextLiftPx?: number;
  className?: string;
  onCallEvent?: (event: Event) => void;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function overridePoweredByLabel(shadowRoot: ShadowRoot, replacementText: string) {
  const replacement = replacementText.trim();
  if (!replacement) return;

  const elements = Array.from(shadowRoot.querySelectorAll<HTMLElement>('*'));
  for (const element of elements) {
    const text = normalizeWhitespace(element.textContent ?? '');
    if (!text || !POWERED_BY_ELEVENLABS_PATTERN.test(text)) continue;

    const hasMatchingChild = Array.from(element.children).some((child) => {
      if (!(child instanceof HTMLElement)) return false;
      const childText = normalizeWhitespace(child.textContent ?? '');
      return Boolean(childText && POWERED_BY_ELEVENLABS_PATTERN.test(childText));
    });
    if (hasMatchingChild) continue;

    if (text !== replacement) {
      element.textContent = replacement;
    }
    element.setAttribute('aria-label', replacement);
  }
}

function setOptionalAttribute(element: HTMLElement, name: string, value?: string) {
  if (value && value.trim()) {
    element.setAttribute(name, value);
    return;
  }

  element.removeAttribute(name);
}

function ensureConvAIScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.customElements.get(WIDGET_TAG_NAME)) {
    return Promise.resolve();
  }

  if (window.__elConvaiScriptLoading) {
    return window.__elConvaiScriptLoading;
  }

  window.__elConvaiScriptLoading = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${EMBED_SCRIPT_SRC}"]`
    );

    const onReady = () => resolve();
    const onError = () => reject(new Error('Failed to load ElevenLabs ConvAI embed script.'));

    if (existingScript) {
      if (window.customElements.get(WIDGET_TAG_NAME)) {
        onReady();
        return;
      }

      existingScript.addEventListener('load', onReady, { once: true });
      existingScript.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    script.type = 'text/javascript';
    script.addEventListener('load', onReady, { once: true });
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  });

  return window.__elConvaiScriptLoading;
}

function findExpandedPanelRect(shadowRoot: ShadowRoot): DOMRect | null {
  let bestRect: DOMRect | null = null;
  let bestScore = 0;
  const viewportArea = window.innerWidth * window.innerHeight;

  const elements = Array.from(shadowRoot.querySelectorAll<HTMLElement>('*'));
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.width < 220 || rect.height < 220) continue;
    if (rect.width > window.innerWidth * 0.96 || rect.height > window.innerHeight * 0.96) continue;

    const area = rect.width * rect.height;
    if (area > viewportArea * 0.92) continue;

    const computedStyle = window.getComputedStyle(element);
    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      Number(computedStyle.opacity || '1') <= 0
    ) {
      continue;
    }

    const borderRadius = Number.parseFloat(computedStyle.borderTopLeftRadius || '0');
    const backgroundColor = computedStyle.backgroundColor;
    const hasVisibleBackground =
      backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)';
    const hasRoundedContainer = Number.isFinite(borderRadius) && borderRadius >= 8;
    if (!hasVisibleBackground && !hasRoundedContainer) continue;

    const hasInputLikeChild = Boolean(element.querySelector('input, textarea, button'));
    const score = area + (hasInputLikeChild ? area * 0.2 : 0) + (hasRoundedContainer ? area * 0.1 : 0);

    if (score > bestScore) {
      bestScore = score;
      bestRect = rect;
    }
  }

  return bestRect;
}

function findBottomInputRect(shadowRoot: ShadowRoot, panelRect: DOMRect): DOMRect | null {
  let bestRect: DOMRect | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  const inputLikeNodes = Array.from(
    shadowRoot.querySelectorAll<HTMLElement>('textarea, input[type="text"], [contenteditable="true"]')
  );

  for (const node of inputLikeNodes) {
    const style = window.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity || '1') <= 0
    ) {
      continue;
    }

    const rect = node.getBoundingClientRect();
    if (rect.width < 180 || rect.height < 26) continue;

    const inPanelBounds =
      rect.left >= panelRect.left - 2 &&
      rect.right <= panelRect.right + 2 &&
      rect.top >= panelRect.top - 2 &&
      rect.bottom <= panelRect.bottom + 2;
    if (!inPanelBounds) continue;

    const lowerBias = rect.top - panelRect.top;
    const score = rect.width * 2 + lowerBias;

    if (score > bestScore) {
      bestScore = score;
      bestRect = rect;
    }
  }

  return bestRect;
}

function placeProviderOverlayWithinPanel({
  overlay,
  panelRect,
  desiredCenterX,
  desiredTop,
}: {
  overlay: HTMLElement;
  panelRect: DOMRect;
  desiredCenterX: number;
  desiredTop: number;
}) {
  // Temporarily render off-screen to get dimensions for safe clamping.
  overlay.style.display = 'inline-flex';
  overlay.style.visibility = 'hidden';
  overlay.style.left = '-9999px';
  overlay.style.top = '0';

  const rect = overlay.getBoundingClientRect();
  const overlayWidth = rect.width || 120;
  const overlayHeight = rect.height || 14;

  const minCenterX = panelRect.left + overlayWidth / 2 + 6;
  const maxCenterX = panelRect.right - overlayWidth / 2 - 6;
  const centerX = Math.min(maxCenterX, Math.max(minCenterX, desiredCenterX));

  const minTop = panelRect.top + 6;
  const maxTop = panelRect.bottom - overlayHeight - 6;
  const top = Math.min(maxTop, Math.max(minTop, desiredTop));

  overlay.style.left = `${Math.round(centerX)}px`;
  overlay.style.top = `${Math.round(top)}px`;
  overlay.style.visibility = 'visible';
  overlay.style.display = 'inline-flex';
}

function placeProviderOverlayInInputGap({
  overlay,
  panelRect,
  inputRect,
  fallbackOffsetY,
}: {
  overlay: HTMLElement;
  panelRect: DOMRect;
  inputRect: DOMRect;
  fallbackOffsetY: number;
}) {
  overlay.style.display = 'inline-flex';
  overlay.style.visibility = 'hidden';
  overlay.style.left = '-9999px';
  overlay.style.top = '0';

  const measured = overlay.getBoundingClientRect();
  const overlayHeight = measured.height || 14;

  const gapTop = inputRect.bottom;
  const gapBottom = panelRect.bottom;
  const availableGap = Math.max(0, gapBottom - gapTop);

  let desiredTop: number;
  if (availableGap >= overlayHeight + 6) {
    desiredTop = gapTop + (availableGap - overlayHeight) / 2;
  } else {
    // If the gap is too tight, place text just inside the input near its bottom edge.
    desiredTop = inputRect.bottom - overlayHeight - Math.max(2, fallbackOffsetY);
  }

  placeProviderOverlayWithinPanel({
    overlay,
    panelRect,
    desiredCenterX: inputRect.left + inputRect.width / 2,
    desiredTop,
  });
}

function findBottomInputElement(shadowRoot: ShadowRoot, panelRect: DOMRect): HTMLElement | null {
  let bestElement: HTMLElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  const inputLikeNodes = Array.from(
    shadowRoot.querySelectorAll<HTMLElement>('textarea, input[type="text"], [contenteditable="true"]')
  );

  for (const node of inputLikeNodes) {
    const style = window.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity || '1') <= 0
    ) {
      continue;
    }

    const rect = node.getBoundingClientRect();
    if (rect.width < 180 || rect.height < 26) continue;

    const inPanelBounds =
      rect.left >= panelRect.left - 2 &&
      rect.right <= panelRect.right + 2 &&
      rect.top >= panelRect.top - 2 &&
      rect.bottom <= panelRect.bottom + 2;
    if (!inPanelBounds) continue;

    const lowerBias = rect.top - panelRect.top;
    const score = rect.width * 2 + lowerBias;

    if (score > bestScore) {
      bestScore = score;
      bestElement = node;
    }
  }

  return bestElement;
}

function parseStoredNumber(value: string | null): number | null {
  if (value == null || value === '') return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function tuneBottomInputBox(
  shadowRoot: ShadowRoot,
  panelRect: DOMRect,
  shrinkPx: number,
  textLiftPx: number
) {
  if (shrinkPx <= 0 && textLiftPx <= 0) return;

  const inputElement = findBottomInputElement(shadowRoot, panelRect);
  if (!inputElement) return;

  const computed = window.getComputedStyle(inputElement);
  if (inputElement.getAttribute(INPUT_TUNED_ATTR) !== '1') {
    inputElement.setAttribute(INPUT_TUNED_ATTR, '1');
    inputElement.setAttribute(
      INPUT_BASE_MIN_HEIGHT_ATTR,
      `${Number.parseFloat(computed.minHeight || '0') || 0}`
    );
    inputElement.setAttribute(INPUT_BASE_HEIGHT_ATTR, `${Number.parseFloat(computed.height || '0') || 0}`);
    inputElement.setAttribute(
      INPUT_BASE_PADDING_TOP_ATTR,
      `${Number.parseFloat(computed.paddingTop || '0') || 0}`
    );
    inputElement.setAttribute(
      INPUT_BASE_PADDING_BOTTOM_ATTR,
      `${Number.parseFloat(computed.paddingBottom || '0') || 0}`
    );
  }

  const baseMinHeight = parseStoredNumber(inputElement.getAttribute(INPUT_BASE_MIN_HEIGHT_ATTR));
  const baseHeight = parseStoredNumber(inputElement.getAttribute(INPUT_BASE_HEIGHT_ATTR));
  const basePaddingTop = parseStoredNumber(inputElement.getAttribute(INPUT_BASE_PADDING_TOP_ATTR));
  const basePaddingBottom = parseStoredNumber(inputElement.getAttribute(INPUT_BASE_PADDING_BOTTOM_ATTR));

  if (baseMinHeight != null && baseMinHeight > 0) {
    inputElement.style.minHeight = `${Math.max(30, baseMinHeight - shrinkPx)}px`;
  }
  if (baseHeight != null && baseHeight > 0) {
    inputElement.style.height = `${Math.max(30, baseHeight - shrinkPx)}px`;
  }
  if (basePaddingTop != null) {
    inputElement.style.paddingTop = `${Math.max(2, basePaddingTop - textLiftPx)}px`;
  }
  if (basePaddingBottom != null) {
    inputElement.style.paddingBottom = `${Math.max(2, basePaddingBottom - textLiftPx)}px`;
  }
}

function rectSignature(rect: DOMRect | DOMRectReadOnly) {
  return `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)}`;
}

function findLikelyOrbCandidate(shadowRoot: ShadowRoot, panelRect: DOMRect | null) {
  let best:
    | {
        element: HTMLElement;
        rect: DOMRect;
        score: number;
      }
    | null = null;

  const elements = Array.from(shadowRoot.querySelectorAll<HTMLElement>('*'));
  for (const element of elements) {
    const style = window.getComputedStyle(element);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity || '1') <= 0
    ) {
      continue;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 72 || rect.height < 72) continue;
    if (rect.width > window.innerWidth * 0.9 || rect.height > window.innerHeight * 0.9) continue;

    const maxDim = Math.max(rect.width, rect.height);
    const minDim = Math.min(rect.width, rect.height);
    const aspectDelta = Math.abs(rect.width - rect.height) / maxDim;
    if (aspectDelta > 0.22) continue;

    if (panelRect) {
      const inPanelBounds =
        rect.left >= panelRect.left - 4 &&
        rect.right <= panelRect.right + 4 &&
        rect.top >= panelRect.top - 4 &&
        rect.bottom <= panelRect.bottom + 4;
      if (!inPanelBounds) continue;
    }

    const borderRadius = Number.parseFloat(style.borderTopLeftRadius || '0');
    const hasRoundRadius =
      borderRadius >= minDim * 0.35 ||
      style.borderRadius.includes('9999') ||
      style.borderRadius.includes('%');
    const hasCanvasOrSvg = Boolean(element.querySelector('canvas, svg'));
    const hasBackgroundImage = style.backgroundImage && style.backgroundImage !== 'none';

    let score = minDim;
    score -= aspectDelta * 320;
    if (hasRoundRadius) score += 80;
    if (hasCanvasOrSvg) score += 48;
    if (hasBackgroundImage) score += 36;

    if (panelRect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const panelCenterX = panelRect.left + panelRect.width / 2;
      const normalizedY = (centerY - panelRect.top) / Math.max(1, panelRect.height);

      score -= Math.abs(centerX - panelCenterX) * 0.35;
      score -= Math.abs(normalizedY - 0.42) * 140;
    }

    if (!best || score > best.score) {
      best = { element, rect, score };
    }
  }

  return best;
}

export function dispatchConvAIExpandAction(action: ExpandAction) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(EXPAND_EVENT_NAME, {
      detail: { action },
    })
  );
}

export function ConvAIWidgetEmbed({
  agentId,
  variant = 'compact',
  dismissible = true,
  serverLocation,
  actionText,
  startCallText,
  endCallText,
  expandText,
  listeningText,
  speakingText,
  avatarImageUrl,
  avatarOrbColor1,
  avatarOrbColor2,
  dynamicVariables,
  overrideLanguage,
  overridePrompt,
  overrideFirstMessage,
  overrideVoiceId,
  themeColors,
  secondaryLogoUrl,
  secondaryLogoAlt = 'Company logo',
  secondaryLogoSize = 42,
  secondaryLogoOffsetX = 18,
  secondaryLogoOffsetY = 14,
  secondaryLogoRounded = true,
  secondaryLogoShadow = true,
  providerText,
  providerUrl,
  providerIconUrl,
  providerIconSize = 12,
  providerColor = 'rgba(15, 23, 42, 0.78)',
  providerFontSize = 11,
  providerOffsetY = 6,
  poweredByTextOverride,
  orbDebug = false,
  inputBoxShrinkPx = 6,
  inputTextLiftPx = 6,
  className,
  onCallEvent,
}: ConvAIWidgetEmbedProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = React.useState(false);
  const [scriptError, setScriptError] = React.useState<string | null>(null);

  const dynamicVariablesJson = React.useMemo(() => {
    if (!dynamicVariables || Object.keys(dynamicVariables).length === 0) {
      return undefined;
    }

    return JSON.stringify(dynamicVariables);
  }, [dynamicVariables]);

  React.useEffect(() => {
    let cancelled = false;

    ensureConvAIScript()
      .then(() => {
        if (cancelled) return;
        setScriptReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to initialize ElevenLabs ConvAI embed script.';
        setScriptError(message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!scriptReady || !containerRef.current) return;

    const containerElement = containerRef.current;

    const widgetElement = document.createElement(WIDGET_TAG_NAME);
    widgetElement.setAttribute('agent-id', agentId);

    setOptionalAttribute(widgetElement, 'variant', variant);
    setOptionalAttribute(widgetElement, 'server-location', serverLocation);
    setOptionalAttribute(widgetElement, 'action-text', actionText);
    setOptionalAttribute(widgetElement, 'start-call-text', startCallText);
    setOptionalAttribute(widgetElement, 'end-call-text', endCallText);
    setOptionalAttribute(widgetElement, 'expand-text', expandText);
    setOptionalAttribute(widgetElement, 'listening-text', listeningText);
    setOptionalAttribute(widgetElement, 'speaking-text', speakingText);
    setOptionalAttribute(widgetElement, 'avatar-image-url', avatarImageUrl);
    setOptionalAttribute(widgetElement, 'avatar-orb-color-1', avatarOrbColor1);
    setOptionalAttribute(widgetElement, 'avatar-orb-color-2', avatarOrbColor2);
    setOptionalAttribute(widgetElement, 'dynamic-variables', dynamicVariablesJson);
    setOptionalAttribute(widgetElement, 'override-language', overrideLanguage);
    setOptionalAttribute(widgetElement, 'override-prompt', overridePrompt);
    setOptionalAttribute(widgetElement, 'override-first-message', overrideFirstMessage);
    setOptionalAttribute(widgetElement, 'override-voice-id', overrideVoiceId);

    if (themeColors) {
      for (const [key, cssVariableName] of Object.entries(themeColorCssVariableMap) as [
        ThemeColorKey,
        string,
      ][]) {
        const value = themeColors[key];
        if (value && value.trim()) {
          widgetElement.style.setProperty(cssVariableName, value);
        } else {
          widgetElement.style.removeProperty(cssVariableName);
        }
      }
    }

    if (dismissible) {
      widgetElement.setAttribute('dismissible', 'true');
    } else {
      widgetElement.removeAttribute('dismissible');
    }

    const handleCallEvent = (event: Event) => onCallEvent?.(event);

    widgetElement.addEventListener(CALL_EVENT_NAME, handleCallEvent as EventListener);
    window.addEventListener(CALL_EVENT_NAME, handleCallEvent as EventListener);
    containerElement.replaceChildren(widgetElement);

    const logoOverlay = document.createElement('img');
    logoOverlay.alt = secondaryLogoAlt;
    logoOverlay.style.position = 'fixed';
    logoOverlay.style.zIndex = '2147483647';
    logoOverlay.style.pointerEvents = 'none';
    logoOverlay.style.objectFit = 'contain';
    logoOverlay.style.display = 'none';
    logoOverlay.style.width = `${secondaryLogoSize}px`;
    logoOverlay.style.height = `${secondaryLogoSize}px`;
    logoOverlay.style.borderRadius = secondaryLogoRounded ? '9999px' : '0';
    logoOverlay.style.boxShadow = secondaryLogoShadow ? '0 6px 16px rgba(0, 0, 0, 0.2)' : 'none';

    const providerOverlay = document.createElement(
      providerUrl ? 'a' : 'div'
    ) as HTMLAnchorElement | HTMLDivElement;
    const providerIcon = document.createElement('img');
    const providerLabel = document.createElement('span');
    providerLabel.textContent = providerText ?? '';
    const orbDebugOverlay = document.createElement('div');
    const orbDebugLabel = document.createElement('div');

    providerOverlay.style.display = 'none';
    providerOverlay.style.position = 'fixed';
    providerOverlay.style.zIndex = '2147483647';
    providerOverlay.style.transform = 'translate(-50%, 0)';
    providerOverlay.style.alignItems = 'center';
    providerOverlay.style.justifyContent = 'center';
    providerOverlay.style.gap = '6px';
    providerOverlay.style.whiteSpace = 'nowrap';
    providerOverlay.style.textAlign = 'center';
    providerOverlay.style.fontWeight = '500';
    providerOverlay.style.fontSize = `${providerFontSize}px`;
    providerOverlay.style.lineHeight = '1.2';
    providerOverlay.style.color = providerColor;
    providerOverlay.style.textShadow = '0 1px 2px rgba(255, 255, 255, 0.4)';
    providerOverlay.style.pointerEvents = providerUrl ? 'auto' : 'none';

    providerIcon.alt = '';
    providerIcon.style.display = providerIconUrl ? 'inline-block' : 'none';
    providerIcon.style.width = `${providerIconSize}px`;
    providerIcon.style.height = `${providerIconSize}px`;
    providerIcon.style.objectFit = 'contain';
    providerIcon.style.flexShrink = '0';
    if (providerIconUrl) {
      providerIcon.src = providerIconUrl;
    }

    providerOverlay.appendChild(providerIcon);
    providerOverlay.appendChild(providerLabel);
    if (providerOverlay instanceof HTMLAnchorElement && providerUrl) {
      providerOverlay.href = providerUrl;
      providerOverlay.target = '_blank';
      providerOverlay.rel = 'noopener noreferrer';
      providerOverlay.style.textDecoration = 'none';
    }

    orbDebugOverlay.style.position = 'fixed';
    orbDebugOverlay.style.zIndex = '2147483647';
    orbDebugOverlay.style.pointerEvents = 'none';
    orbDebugOverlay.style.display = 'none';
    orbDebugOverlay.style.border = '2px dashed #22c55e';
    orbDebugOverlay.style.borderRadius = '9999px';
    orbDebugOverlay.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.12)';
    orbDebugOverlay.style.background = 'rgba(34, 197, 94, 0.08)';

    orbDebugLabel.style.position = 'fixed';
    orbDebugLabel.style.zIndex = '2147483647';
    orbDebugLabel.style.pointerEvents = 'none';
    orbDebugLabel.style.display = 'none';
    orbDebugLabel.style.padding = '4px 6px';
    orbDebugLabel.style.borderRadius = '6px';
    orbDebugLabel.style.background = 'rgba(15, 23, 42, 0.92)';
    orbDebugLabel.style.color = '#ffffff';
    orbDebugLabel.style.font = '11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace';
    orbDebugLabel.style.whiteSpace = 'nowrap';

    let shadowObserver: MutationObserver | null = null;
    const poweredByOverrideText = poweredByTextOverride?.trim();
    let lastOrbDebugSignature = '';
    const shouldTrackWidgetMutations = Boolean(
      secondaryLogoUrl || providerText || poweredByOverrideText || orbDebug
    );
    const shouldHandleResize = Boolean(secondaryLogoUrl || providerText || orbDebug);
    const updateSecondaryLogoPosition = () => {
      const shadowRoot = widgetElement.shadowRoot;
      if (!secondaryLogoUrl || !shadowRoot) {
        logoOverlay.style.display = 'none';
      }
      if (!providerText || !shadowRoot) {
        providerOverlay.style.display = 'none';
      }

      if (!shadowRoot) {
        if (orbDebug) {
          orbDebugOverlay.style.display = 'none';
          orbDebugLabel.style.display = 'none';
        }
        return;
      }
      if (poweredByOverrideText) {
        overridePoweredByLabel(shadowRoot, poweredByOverrideText);
      }

      if (secondaryLogoUrl) {
        logoOverlay.src = secondaryLogoUrl;
        logoOverlay.style.width = `${secondaryLogoSize}px`;
        logoOverlay.style.height = `${secondaryLogoSize}px`;
        logoOverlay.style.borderRadius = secondaryLogoRounded ? '9999px' : '0';
        logoOverlay.style.boxShadow = secondaryLogoShadow ? '0 6px 16px rgba(0, 0, 0, 0.2)' : 'none';
      }
      if (providerText) {
        providerLabel.textContent = providerText;
        providerOverlay.style.fontSize = `${providerFontSize}px`;
        providerOverlay.style.color = providerColor;
        providerIcon.style.display = providerIconUrl ? 'inline-block' : 'none';
        providerIcon.style.width = `${providerIconSize}px`;
        providerIcon.style.height = `${providerIconSize}px`;
        if (providerIconUrl) {
          providerIcon.src = providerIconUrl;
        }
      }

      const panelRect = findExpandedPanelRect(shadowRoot);
      if (orbDebug) {
        const candidate = findLikelyOrbCandidate(shadowRoot, panelRect);
        if (candidate) {
          const rect = candidate.rect;
          orbDebugOverlay.style.left = `${Math.round(rect.left)}px`;
          orbDebugOverlay.style.top = `${Math.round(rect.top)}px`;
          orbDebugOverlay.style.width = `${Math.round(rect.width)}px`;
          orbDebugOverlay.style.height = `${Math.round(rect.height)}px`;
          orbDebugOverlay.style.display = 'block';

          const labelLeft = panelRect ? panelRect.left + 8 : rect.left;
          const labelTop = panelRect ? panelRect.top + 8 : Math.max(8, rect.top - 24);
          orbDebugLabel.style.left = `${Math.round(labelLeft)}px`;
          orbDebugLabel.style.top = `${Math.round(labelTop)}px`;
          orbDebugLabel.textContent = `orb ${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)} score=${candidate.score.toFixed(1)}`;
          orbDebugLabel.style.display = 'block';

          const nextSignature = `${rectSignature(rect)}|${panelRect ? rectSignature(panelRect) : 'no-panel'}`;
          if (nextSignature !== lastOrbDebugSignature) {
            lastOrbDebugSignature = nextSignature;
            console.info('[convai-orb-debug]', {
              rect: {
                left: Math.round(rect.left),
                top: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
              panel: panelRect
                ? {
                    left: Math.round(panelRect.left),
                    top: Math.round(panelRect.top),
                    width: Math.round(panelRect.width),
                    height: Math.round(panelRect.height),
                  }
                : null,
              tag: candidate.element.tagName.toLowerCase(),
            });
          }
        } else {
          orbDebugOverlay.style.display = 'none';
          orbDebugLabel.style.display = 'block';
          if (panelRect) {
            orbDebugLabel.style.left = `${Math.round(panelRect.left + 8)}px`;
            orbDebugLabel.style.top = `${Math.round(panelRect.top + 8)}px`;
          }
          orbDebugLabel.textContent = 'orb not found';
        }
      }

      if (panelRect) {
        tuneBottomInputBox(shadowRoot, panelRect, inputBoxShrinkPx, inputTextLiftPx);

        if (secondaryLogoUrl) {
          logoOverlay.style.left = `${Math.round(panelRect.left + secondaryLogoOffsetX)}px`;
          logoOverlay.style.top = `${Math.round(panelRect.top + secondaryLogoOffsetY)}px`;
          logoOverlay.style.display = 'block';
        }
        if (providerText) {
          const inputRect = findBottomInputRect(shadowRoot, panelRect);
          if (inputRect) {
            placeProviderOverlayInInputGap({
              overlay: providerOverlay,
              panelRect,
              inputRect,
              fallbackOffsetY: providerOffsetY,
            });
          } else {
            placeProviderOverlayWithinPanel({
              overlay: providerOverlay,
              panelRect,
              desiredCenterX: panelRect.left + panelRect.width / 2,
              desiredTop: panelRect.bottom - 20 - providerOffsetY,
            });
          }
        }
        return;
      }

      // If expanded panel is not detected, treat widget as collapsed and hide provider text.
      providerOverlay.style.display = 'none';

      // Fallback: anchor logo to host element to keep it visible if panel detection fails.
      const hostRect = widgetElement.getBoundingClientRect();
      if (hostRect.width > 0 && hostRect.height > 0) {
        if (secondaryLogoUrl) {
          logoOverlay.style.left = `${Math.round(hostRect.left + secondaryLogoOffsetX)}px`;
          logoOverlay.style.top = `${Math.round(hostRect.top + secondaryLogoOffsetY)}px`;
          logoOverlay.style.display = 'block';
        }
      } else {
        logoOverlay.style.display = 'none';
        providerOverlay.style.display = 'none';
      }
    };

    let pollInterval: number | null = null;
    if (shouldTrackWidgetMutations) {
      if (secondaryLogoUrl) {
        document.body.appendChild(logoOverlay);
      }
      if (providerText) {
        document.body.appendChild(providerOverlay);
      }
      if (orbDebug) {
        document.body.appendChild(orbDebugOverlay);
        document.body.appendChild(orbDebugLabel);
      }
      updateSecondaryLogoPosition();

      if (widgetElement.shadowRoot) {
        shadowObserver = new MutationObserver(updateSecondaryLogoPosition);
        shadowObserver.observe(widgetElement.shadowRoot, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      }

      if (shouldHandleResize) {
        window.addEventListener('resize', updateSecondaryLogoPosition);
      }
      pollInterval = window.setInterval(updateSecondaryLogoPosition, 350);
    }

    return () => {
      widgetElement.removeEventListener(CALL_EVENT_NAME, handleCallEvent as EventListener);
      window.removeEventListener(CALL_EVENT_NAME, handleCallEvent as EventListener);
      if (shouldHandleResize) {
        window.removeEventListener('resize', updateSecondaryLogoPosition);
      }
      if (pollInterval !== null) {
        window.clearInterval(pollInterval);
      }
      shadowObserver?.disconnect();

      if (logoOverlay.parentNode) {
        logoOverlay.parentNode.removeChild(logoOverlay);
      }
      if (providerOverlay.parentNode) {
        providerOverlay.parentNode.removeChild(providerOverlay);
      }
      if (orbDebugOverlay.parentNode) {
        orbDebugOverlay.parentNode.removeChild(orbDebugOverlay);
      }
      if (orbDebugLabel.parentNode) {
        orbDebugLabel.parentNode.removeChild(orbDebugLabel);
      }

      if (containerElement.contains(widgetElement)) {
        containerElement.removeChild(widgetElement);
      }
    };
  }, [
    actionText,
    agentId,
    avatarImageUrl,
    avatarOrbColor1,
    avatarOrbColor2,
    dismissible,
    dynamicVariablesJson,
    endCallText,
    expandText,
    listeningText,
    onCallEvent,
    overrideFirstMessage,
    overrideLanguage,
    overridePrompt,
    overrideVoiceId,
    scriptReady,
    secondaryLogoAlt,
    secondaryLogoOffsetX,
    secondaryLogoOffsetY,
    secondaryLogoRounded,
    secondaryLogoShadow,
    secondaryLogoSize,
    secondaryLogoUrl,
    providerText,
    providerUrl,
    providerIconUrl,
    providerIconSize,
    providerColor,
    providerFontSize,
    providerOffsetY,
    poweredByTextOverride,
    orbDebug,
    inputBoxShrinkPx,
    inputTextLiftPx,
    serverLocation,
    speakingText,
    startCallText,
    themeColors,
    variant,
  ]);

  if (scriptError) {
    return (
      <div className={className}>
        <p className="text-destructive text-sm">{scriptError}</p>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
