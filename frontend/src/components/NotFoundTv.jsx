/* Retro TV illustration - design inspired by Stefan Devai (Dribbble) */
export default function NotFoundTv() {
  return (
    <div className="nf-main_wrapper">
      <div className="nf-main">
        <div className="nf-antenna">
          <div className="nf-antenna_shadow" />
          <div className="nf-a1" />
          <div className="nf-a1d" />
          <div className="nf-a2" />
          <div className="nf-a2d" />
          <div className="nf-a_base" />
        </div>
        <div className="nf-tv">
          <div className="nf-cruve">
            <svg
              className="nf-curve_svg"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 189.929 189.929"
              xmlSpace="preserve"
              aria-hidden
            >
              <path d="M70.343,70.343c-30.554,30.553-44.806,72.7-39.102,115.635l-29.738,3.951C-5.442,137.659,11.917,86.34,49.129,49.13 C86.34,11.918,137.664-5.445,189.928,1.502l-3.95,29.738C143.041,25.54,100.895,39.789,70.343,70.343z" />
            </svg>
          </div>
          <div className="nf-display_div">
            <div className="nf-screen_out">
              <div className="nf-screen_out1">
                <div className="nf-screen">
                  <span className="nf-notfound_text"> NOT FOUND</span>
                </div>
                <div className="nf-screenM">
                  <span className="nf-notfound_text"> NOT FOUND</span>
                </div>
              </div>
            </div>
          </div>
          <div className="nf-lines">
            <div className="nf-line1" />
            <div className="nf-line2" />
            <div className="nf-line3" />
          </div>
          <div className="nf-buttons_div">
            <div className="nf-b1"><div /></div>
            <div className="nf-b2" />
            <div className="nf-speakers">
              <div className="nf-g1">
                <div className="nf-g11" />
                <div className="nf-g12" />
                <div className="nf-g13" />
              </div>
              <div className="nf-g" />
              <div className="nf-g" />
            </div>
          </div>
        </div>
        <div className="nf-bottom">
          <div className="nf-base1" />
          <div className="nf-base2" />
          <div className="nf-base3" />
        </div>
      </div>
      <div className="nf-text_404" aria-hidden>
        <div className="nf-text_4041">4</div>
        <div className="nf-text_4042">0</div>
        <div className="nf-text_4043">4</div>
      </div>
    </div>
  );
}
