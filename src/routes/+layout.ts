// This can be false if you're using a fallback (i.e. SPA mode)
export const prerender = true;

import posthog from 'posthog-js'
import { browser } from '$app/environment';

export const load = async () => {

  if (browser) {
    posthog.init(
      'phc_ECDHadrRNwpqT7tgukzWXjdazpw75B8hyA1Z7BhGXE8',
      { 
        api_host: 'https://eu.i.posthog.com',
        person_profiles: 'always',
      }
    )
  }
  return
};