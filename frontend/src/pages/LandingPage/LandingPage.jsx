import { useEffect, useState } from 'react'
import { getHealth } from '../../services/api'
import { Navbar } from '../../components/Navbar'
import { Hero } from '../../components/Hero'
import { ServicesSection } from '../../components/ServicesSection'
import { HowItWorks } from '../../components/HowItWorks'
import { TrustSection } from '../../components/TrustSection'
import { Footer } from '../../components/Footer'
import './LandingPage.css'

export default function LandingPage(){
  const [apiOnline,setApiOnline]=useState(null)
  useEffect(()=>{getHealth().then(()=>setApiOnline(true)).catch(()=>setApiOnline(false))},[])
  return <div className="site-shell"><Navbar/><main><Hero/><ServicesSection/><HowItWorks/><TrustSection/></main><Footer/><div className={`api-status ${apiOnline===true?'online':''}`}><span/> {apiOnline===true?'API connected':'Connecting to WorkMan'}</div></div>
}
