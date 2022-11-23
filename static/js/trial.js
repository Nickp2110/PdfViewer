var bus_registry = {};

class Core {
      on(key, operation) {
            bus_registry[key] = operation;
      }
      trigger(key, data) {
            let operation = bus_registry[key];
            operation(data);
      }
}

class PdfCanvas extends Core {
      constructor(parent) {
            super();
            this.newState = null;
            this.parent = parent;
            this.element = null;
            this.ctx = null;
            this.url = '/static/docs/pdf.pdf'
            this.pdfDoc = null;
            // this.viewport = null;
            this.state = {
                  current_page: 1,
                  scale: 1
            }
            this.viewport = null,
                  this.template = `
            <canvas id="pdf-render"></canvas>
            `;
            this.on('pdfUpdatedState', this.onStateChange.bind(this));
      }
      load() {
            this._load_element()
                  .then(() => {
                        this._load_pdf()
                              .then((pdfDoc_) => {
                                    this.pdfDoc = pdfDoc_
                                    this.total_page = this.pdfDoc.numPages;
                                    this.render();
                                    this.trigger('pdfLoaded', this.total_page);
                              })
                  })
      }

      _load_element() {
            return new Promise(function (resolve, reject) {
                  const parser = new DOMParser();
                  var template = this.template;
                  const doc = parser.parseFromString(template, "text/html");
                  this.element = doc.body.firstChild;
                  this.parent.appendChild(this.element);
                  this.ctx = this.element.getContext('2d');
                  resolve()
            }.bind(this));
      }

      onStateChange(newState) {
            this.state = newState;
            this.render();
      };
      render() {
            this.pdfDoc.getPage(this.state.current_page).then(page => {
                  this.viewport = page.getViewport({ scale: this.state.scale });
                  this.element.height = this.viewport.height;
                  this.element.width = this.viewport.width;
                  const renderCtx = {
                        canvasContext: this.ctx,
                        viewport: this.viewport
                  };
                  page.render(renderCtx);
                  // this.trigger('canvasDimension', this.viewport);
            });
      };
      _load_pdf() {
            return new Promise(function (resolve, reject) {
                  pdfjsLib
                        .getDocument(this.url)
                        .promise.then(pdfDoc_ => {
                              resolve(pdfDoc_);
                        });
            }.bind(this));
      };
}

class topbar extends Core {
      constructor(parent) {
            super();
            this.parent = parent;
            this.element = null;
            this.state = {
                  current_page: 1,
                  scale: 1
            }
            this.total_page = 0;
            this.template = `
            <div class="top-bar"> 
                  <button class="btn" id="prev-page"> 
                        <i class="fas fa-arrow-circle-left"></i> Prev Page 
                  </button> 
                  <button class="btn" id="next-page"> 
                        Next Page <i class="fas fa-arrow-circle-right"></i>
                  </button> 
                  <span class="page-info"> Page 
                        <span id="page-num"></span> of 
                        <span id="page-count"></span> 
                  </span> 
                  <b>&nbsp; &nbsp; &nbsp;</b> 
                  <button class="btn" id="zoom-out"> 
                        - 
                  </button> 
                  <button class="btn" id="zoom-in"> 
                        + 
                  </button>
            </div> 
            `;
            this.on('pdfLoaded', this.pdfLoaded.bind(this))
      }
      pdfLoaded(total_pages) {
            this.total_page = total_pages;
            this.render();
      };

      _load_element() {
            return new Promise(function (resolve, reject) {
                  const parser = new DOMParser();
                  var template = this.template;
                  const doc = parser.parseFromString(template, "text/html");
                  this.element = doc.body.firstChild;
                  resolve(this.parent.appendChild(this.element));
            }.bind(this));
      }

      load() {
            this._load_element().then(this._bind_events())
      }

      _bind_events() {
            this.element.querySelector('#prev-page').addEventListener('click', this.showPrevPage.bind(this))
            this.element.querySelector('#next-page').addEventListener('click', this.showNextPage.bind(this))
            this.element.querySelector('#zoom-out').addEventListener('click', this.zoomOut.bind(this))
            this.element.querySelector('#zoom-in').addEventListener('click', this.zoomIn.bind(this))
      }
      render() {
            this.element.querySelector('#page-num').textContent = this.state.current_page;
            this.element.querySelector('#page-count').textContent = this.total_page;
      }
      showPrevPage() {
            if (this.state.current_page <= 1) {
                  return;
            }
            this.state.current_page--;
            this.render();
            this.trigger("pdfUpdatedState", this.state);
            console.log('current page is ', this.state.current_page)
      }
      showNextPage() {
            if (this.state.current_page >= this.total_page) {
                  return;
            }
            this.state.current_page++;
            this.render();
            this.trigger("pdfUpdatedState", this.state);
            console.log('current page is ', this.state.current_page)
      }
      zoomOut() {
            if (this.state.scale <= 0.5) {
                  return;
            }
            this.state.scale -= 0.5;
            this.render();
            this.trigger("pdfUpdatedState", this.state);
            console.log('current scale is ', this.state.scale)
      }
      zoomIn() {
            if (this.state.scale >= 3) {
                  return;
            }
            this.state.scale += 0.5;
            this.render();
            this.trigger("pdfUpdatedState", this.state);
            console.log('current scale is ', this.state.scale)
      }
}

class PdfViewer {
      constructor(parent) {
            this.parent = parent;
            this.element = null;
            this.template = `
            <div id="main-container"> 
            </div> 
            `;
      }

      load() {
            this._load_element();
      }

      _load_element() {
            const parser = new DOMParser();
            var template = this.template;
            const doc = parser.parseFromString(template, "text/html");
            this.element = doc.body.firstChild;
            this.parent.appendChild(this.element);
            this.pdfcanvas = new PdfCanvas(this.element);
            this.topbar = new topbar(this.element);
            // this.zDiv = new zDiv(this.element);
            this.topbar.load();
            // this.zDiv.load();
            this.pdfcanvas.load();
      };

};

var viewer = new PdfViewer(document.getElementById("container"));
viewer.load();
