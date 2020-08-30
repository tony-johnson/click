import { LitElement, html, css } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat.js';


/**
 * An element for dispaying recent images
 */
export class RecentImages extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }
      table {
        border-collapse: collapse;
      }
      table, th, td {
        border: 1px solid black;
        padding: 2px;
      }
      #alarmSeconds {
        width: 50px;
      }
    `;
  }

  static get properties() {
    return {
      rows: { type: Number },
      dataURL: { type: String },
      data: { type: Object, notify: true },
      playClick: { type: Boolean, notify: true, reflect: true},
      playAlarm: { type: Boolean, notify: true, reflect: true},
      alarmSeconds: { type: Number, notify: true, reflect: true},
      alarmCountdown: { type: Number, notify: true, reflect: true},
      isAlarm: { type: Boolean, notify: true, reflect: true}
    };
  }

  constructor() {
    super();
    this.rows = 20;
    this.restURL = 'https://lsst-camera-dev.slac.stanford.edu/FITSInfo/rest/images?take=20&sort=%5B%7B%22selector%22:%22obsDate%22,%22desc%22:true%7D%5D';
    this.data = [];
    this.eventSourceUrl = 'https://lsst-camera-dev.slac.stanford.edu/FITSInfo/rest/notify';
    this.click = "sound/camera-shutter-click-03.mp3"
    this.playClick = true;
    this.alarm = "sound/alarm-fast-a1.mp3";
    this.playAlarm = true;
    this.alarmSeconds = 60;
    this.isAlarm = false;
    this.alarmCountdown = -1;
  }

  firstUpdated(changedProperties) {
    let click = new Audio(this.click);
    this.alarm = new Audio(this.alarm);
    let timer = setInterval(() => {
      if (this.alarmCountdown > 0) {
        this.alarmCountdown--;
        this.isAlarm = this.alarmCountdown == 0;
      }
    }, 1000);
    let eventSource = new EventSource(this.eventSourceUrl);
    eventSource.addEventListener("newImage", (event) => {
      this._updateData();
      if (this.playClick) {
        click.play();
      }
      this.alarmCountdown = this.alarmSeconds;
    });

    this._updateData();
  }

  updated(changedProperties)  {
    super.update(changedProperties);
    if (changedProperties.has('isAlarm') && this.playAlarm && this.isAlarm) {
      this.alarm.play();
    } else if (changedProperties.has('alarmSeconds') && changedProperties['alarmSeconds']) {
      this.alarmCountdown = this.alarmSeconds;
    }
  }

  _updateData() {
    fetch(this.restURL)
      .then(response => response.json())
      .then(data => this.data = data.data);
  }

  render() {
    console.group(this.data);
    return html`
      <table class="recentImages">
        <thead>
          <tr>
            <th>Image</th>
            <th>ImgType</th>
            <th>TestType</th>
            <th>Dark Time</th>
            <th>Exp Time</th>
            <th>Run</th>
            <th>Tseqnum</th>
            <th>Date</th>
            <th>Rafts</th>
          </tr>
        </thead>
        <tbody>
          ${repeat(this.data, (row) => row.obsId, (row, index) => html`
            <tr>
              <td><a href="https://lsst-camera-dev.slac.stanford.edu/FITSInfo/view.html?image=${row.obsId}&raft=all" target="imageViewer">${row.obsId}</a></td>
              <td>${row.imgType}</td>
              <td>${row.testType}</td>
              <td>${row.darkTime}</td>
              <td>${row.exposureTime}</td>
              <td>${row.runNumber}</td>
              <td>${row.tseqnum}</td>
              <td>${new Date(row.obsDate).toISOString().substring(0, 19)}</td>
              <td>${this._countRafts(row.raftMask)}</td>
            </tr>
          `)}
        </tbody>
      </table>
      <label><input id="clickCheckbox" type="checkbox" @change=${this._doClick} ?checked=${this.playClick}>Play click on new image</label>
      <label><input id="alarmCheckbox" type="checkbox" @change=${this._doAlarm} ?checked=${this.playAlarm}>Play alarm if no images for
      <input type="number" id="alarmSeconds" value=${this.alarmSeconds} @change=${this._doAlarmSeconds}> seconds</label>
      ${this.isAlarm ? html `<b>Alarm!</b> ${this.playAlarm ? html `<button @click=${this.silence}>Silence</button>`  : undefined}` : this.alarmCountdown > 0 ? html`(Countdown ${this.alarmCountdown})` : undefined}
    `;
  }

  _countRafts(mask) {
    let n = 0;
    for (let i = 0; i < 25; i++) {
      let raft = mask >> i & 1;
      if (raft) {
          n++;
      }
    }
    return n;
  }

  _doClick(e) {
    this.playClick = this.shadowRoot.querySelector("#clickCheckbox").checked;
  }

  _doAlarm(e) {
    this.playAlarm = this.shadowRoot.querySelector("#alarmCheckbox").checked;
  }

  _doAlarmSeconds(e) {
    this.alarmSeconds = parseInt(this.shadowRoot.querySelector("#alarmSeconds").value);
  }

  silence() {
    this.alarm.pause();
    sound.currentTime = 0;
  }
}

window.customElements.define('recent-images', RecentImages);