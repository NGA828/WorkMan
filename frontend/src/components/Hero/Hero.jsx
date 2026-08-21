import './Hero.css'

function HeroVisual() {
  return <div className="hero-visual" aria-label="A verified WorkMan professional ready to help">
    <div className="sun-shape" /><div className="grid-pattern" />
    <div className="person-card"><div className="avatar-illustration"><div className="hair"/><div className="face"/><div className="body"/><div className="tool" /></div></div>
    <div className="status-pill"><span className="status-dot"/><span><b>Available now</b><small>Verified professional</small></span></div>
    <div className="rating-pill"><strong>4.9</strong><span>★★★★★</span></div>
    <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
    <span className="spark spark-one">✦</span><span className="spark spark-two">✦</span>
  </div>
}

export default function Hero() {
  return <section className="hero" id="home"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> LOCAL HELP, DONE RIGHT</div><h1>Good work is<br/><em>closer</em> than you think.</h1><p>Find trusted local professionals for the jobs that matter — from a quick fix to a full transformation.</p><div className="hero-actions"><a href="#services" className="button button-lime">Find a professional <span>↗</span></a><a href="#how-it-works" className="text-link">See how it works <span>↓</span></a></div><div className="hero-proof"><div className="proof-avatars"><span>AM</span><span>JL</span><span>SK</span></div><p><b>12,000+</b> people found help<br/>they can count on.</p></div></div><HeroVisual /></section>
}
