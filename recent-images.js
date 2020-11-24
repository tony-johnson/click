import { LitElement, html, css } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat.js';

import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-layout/app-header/app-header.js';
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
      rows: { type: Number, notify: true, reflect: true },
      baseURL: {
        converter: {
          fromAttribute(value) {
            return new URL(value);
          }
        }
      },
      hiddenColumns: { type: Array, notify: true, reflect: true},
      filter: { type: String, notify: true, reflect: true},
      data: { type: Object, notify: true },
      playClick: { type: Boolean, notify: true, reflect: true },
      playAlarm: { type: Boolean, notify: true, reflect: true },
      alarmSeconds: { type: Number, notify: true, reflect: true },
      alarmCountdown: { type: Number, notify: true, reflect: true },
      isAlarm: { type: Boolean, notify: true, reflect: true }
    };
  }

  constructor() {
    super();
    this.rows = 20;
    this.baseURL = new URL('http://ccs.lsst.org/FITSInfo/');
    this.data = [];
    this.hiddenColumns = [];
    this.filter = null;
    this.click = "sound/camera-shutter-click-03.mp3"
    this.playClick = true;
    this.alarm = "sound/alarm-fast-a1.mp3";
    this.playAlarm = false;
    this.alarmSeconds = 60;
    this.isAlarm = false;
    this.alarmCountdown = -1;
  }

  firstUpdated(changedProperties) {
    this.restURL = new URL('rest/', this.baseURL);
    this.eventSourceURL = new URL('notify', this.restURL);
    this.viewURL = new URL('view.html', this.baseURL);
    let click = new Audio(this.click);
    this.alarm = new Audio(this.alarm);
    let timer = setInterval(() => {
      if (this.alarmCountdown > 0) {
        this.alarmCountdown--;
        this.isAlarm = this.alarmCountdown == 0;
      }
    }, 1000);
    let eventSource = new EventSource(this.eventSourceURL);
    eventSource.addEventListener("newImage", (event) => {
      this._updateData();
      if (this.playClick) {
        click.play();
      }
      this.alarmCountdown = this.alarmSeconds;
    });

    this._updateData();
  }

  updated(changedProperties) {
    super.update(changedProperties);
    if (changedProperties.has('isAlarm') && this.playAlarm && this.isAlarm) {
      this.alarm.play();
    } else if (changedProperties.has('alarmSeconds') && changedProperties['alarmSeconds']) {
      this.alarmCountdown = this.alarmSeconds;
    } else if (changedProperties.has('rows')) {
      this._updateData();
    }
  }

  _updateData() {
    let url = new URL("images", this.restURL);
    url.searchParams.append("take", this.rows);
    if (this.filter) url.searchParams.append("filter", this.filter);
    url.searchParams.append("sort", '[{"selector":"obsDate","desc":true}]');
    fetch(url)
      .then(response => response.json())
      .then(data => this.data = data.data);
  }

  render() {
    let columns = new Map([
      ["Image", (row) => html`<a href=${this._imageURL(row.obsId)} target="imageViewer">${row.obsId}</a>`],
      ["ImgType", (row) => row.imgType],
      ["TestType", (row) => row.testType],
      ["Dark Time", (row) => row.darkTime],
      ["Exp Time", (row) => row.exposureTime],
      ["Run", (row) => row.runNumber],
      ["Tseqnum", (row) => row.tseqnum],
      ["Date", (row) => new Date(row.obsDate).toISOString().substring(0, 19)],
      ["Rafts", (row) => this._countRafts(row.raftMask)]
    ]);
    this.hiddenColumns.forEach((column)=>columns.delete(column));
    return html`
      <table class="recentImages">
        <thead>
          <tr>
            ${repeat(columns.keys(), (columnName, index) => html`<th>${columnName}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${repeat(this.data, (row) => row.obsId, (row, index) => html`
            <tr>
              ${repeat(columns.values(), (columnMapper, index) => html`<td>${columnMapper(row)}</td>`)}
            </tr>
          `)}
        </tbody>
      </table>
      <label><input id="clickCheckbox" type="checkbox" @change=${this._doClick} ?checked=${this.playClick}>Play click on new image</label>
      <label><input id="alarmCheckbox" type="checkbox" @change=${this._doAlarm} ?checked=${this.playAlarm}>Play alarm if no images for
      <input type="number" id="alarmSeconds" value=${this.alarmSeconds} @change=${this._doAlarmSeconds}> seconds</label>
      ${this.isAlarm ? html`<b>Alarm!</b> ${this.playAlarm ? html`<button @click=${this.silence}>Silence</button>` : undefined}` : this.alarmCountdown > 0 ? html`(Countdown ${this.alarmCountdown})` : undefined}
    `;
  }

  _imageURL(obsId) {
    let imageURL = new URL(this.viewURL);
    imageURL.searchParams.append("image", obsId);
    imageURL.searchParams.append("raft", "R22")
    return imageURL;
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