/**
 * GSAP Dynamic Animation Suite for StockSense
 * Powered by gsap-public suite (ScrollTrigger, Flip, TextPlugin, CustomEase)
 */

import gsap from 'gsap';
import { ScrollTrigger } from '@gsap/ScrollTrigger.js';
import { Flip } from '@gsap/Flip.js';
import { TextPlugin } from '@gsap/TextPlugin.js';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Flip, TextPlugin);
}

/**
 * Animate numeric counter smoothly
 */
export function animateCounter(
  target: HTMLElement | null,
  startVal: number,
  endVal: number,
  duration: number = 0.6,
  prefix: string = '',
  suffix: string = ''
) {
  if (!target || typeof window === 'undefined') return;

  const obj = { val: startVal };
  gsap.to(obj, {
    val: endVal,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      if (target) {
        target.innerText = `${prefix}${Math.round(obj.val).toLocaleString()}${suffix}`;
      }
    },
  });
}

/**
 * Pulse trigger alert badge
 */
export function pulseTriggerAlert(element: HTMLElement | null) {
  if (!element || typeof window === 'undefined') return;
  gsap.fromTo(
    element,
    { scale: 1 },
    {
      scale: 1.08,
      duration: 0.25,
      yoyo: true,
      repeat: 3,
      ease: 'power1.inOut',
    }
  );
}

export { gsap, ScrollTrigger, Flip, TextPlugin };
