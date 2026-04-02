import {
  APP_SCHEME,
  BASE_URL,
  GOOGLE_AUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
} from '@heat-check/shared'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      {
        error: 'Google Client ID is not set in environment variables',
      },
      { status: 500 },
    )
  }

  const url = new URL(request.url)
  let idpClientId: string
  let authRedirectUri: string
  const internalClient = url.searchParams.get('client_id')
  const redirectUri = url.searchParams.get('redirect_uri')

  let platform

  if (redirectUri === APP_SCHEME) {
    platform = 'mobile'
  } else {
    return NextResponse.json(
      {
        error: 'Invalid redirect URI',
      },
      { status: 400 },
    )
  }

  if (internalClient === 'google') {
    idpClientId = GOOGLE_CLIENT_ID
    authRedirectUri = GOOGLE_REDIRECT_URI
  } else if (internalClient === 'apple') {
    idpClientId = 'apple-client-id-placeholder' // replace with actual Apple client ID
    authRedirectUri = `apple-redirect-uri-placeholder` // replace with actual Apple redirect URI
  } else {
    return NextResponse.json({ error: 'Invalid client_id' }, { status: 400 })
  }

  let state = platform + '|' + url.searchParams.get('state')

  const params = new URLSearchParams({
    client_id: idpClientId as string,
    redirect_uri: authRedirectUri,
    response_type: 'code',
    scope: url.searchParams.get('scope') || 'identity',
    state: state,
    prompt: 'select_account', // for account selction each login
  })

  return NextResponse.redirect(GOOGLE_AUTH_URL + '?' + params.toString())
}
