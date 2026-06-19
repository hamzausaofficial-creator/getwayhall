import { Link } from 'react-router-dom';
import { Share2, MessageCircle, Globe, Mail } from 'lucide-react';
import AppLogo from '../AppLogo';
import { BRAND_FULL_NAME } from '../../constants/brand';

const PRODUCT = ['Hall Booking', 'Guest House', 'Payments', 'Reports'];
const COMPANY = [
  { label: 'About Us', to: '/about' },
  { label: 'Careers', href: '#' },
  { label: 'Press Kit', href: '#' },
  { label: 'Contact', href: 'mailto:support@gatewaymarriagehall.com' },
];
const SUPPORT = ['Help Center', 'Privacy Policy', 'Terms of Service', 'Cookie Settings'];

function FooterLink({ item }) {
  if (item.to) {
    return <Link to={item.to}>{item.label}</Link>;
  }
  return <a href={item.href || '#'}>{item.label}</a>;
}

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer__grid">
          <div>
            <AppLogo
              size="sm"
              tone="dark"
              showName
              nameAccent="Centre"
              className="app-logo--footer landing-footer__brand"
            />
            <p className="landing-footer__desc">
              Elevating venue management through precision and elegance. The premier operating system for marriage halls and guest houses.
            </p>
            <div className="landing-footer__social">
              {[Share2, MessageCircle, Globe, Mail].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social link">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: 'Product', links: PRODUCT },
            { title: 'Company', links: COMPANY },
            { title: 'Support', links: SUPPORT },
          ].map((col) => (
            <div key={col.title} className="landing-footer__col">
              <h5>{col.title}</h5>
              <ul>
                {col.links.map((l) => (
                  <li key={typeof l === 'string' ? l : l.label}>
                    {typeof l === 'string' ? <a href="#">{l}</a> : <FooterLink item={l} />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="landing-footer__bottom">
          <span>© {new Date().getFullYear()} {BRAND_FULL_NAME}. All rights reserved.</span>
          <div className="landing-footer__legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
