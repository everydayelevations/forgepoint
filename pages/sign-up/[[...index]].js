import { SignUp } from '@clerk/nextjs'
import Head from 'next/head'

export default function SignUpPage() {
  return (
    <>
      <Head>
        <title>Create account · Clavex</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#E7D5B3', padding:'24px' }}>
        <div style={{ textAlign:'center' }}>
          <img src="/clavex-key/walnut.svg" width={96} height={96} alt="Clavex" style={{ display:'block', margin:'0 auto 14px' }} />
          <h1 style={{ fontFamily:'"Zilla Slab", serif', fontWeight:700, fontSize:32, color:'#241A12', marginBottom:6, letterSpacing:'-0.01em' }}>Clavex</h1>
          <p style={{ fontFamily:'"Hanken Grotesk", system-ui, sans-serif', color:'#6E6155', fontSize:14, marginBottom:24 }}>The key between design and delivery.</p>
          <SignUp signInUrl="/sign-in" />
        </div>
      </div>
    </>
  )
}
