import * as PIXI from './pixi.mjs';

class appClass {
  constructor(application, gravityValue, shapeCreationInterval) {
    this.application = application;
    this.gravityValue = gravityValue;

    // Initial value of shapes creation interval. Which is 1 second.
    this.shapeCreationInterval = shapeCreationInterval;

    // Initial value of shapes created per second.
    this.shapesPerSecondNumber = 1;

    this.shapesPerSecondText = document.querySelector('.amount');
    this.numberContainer = document.querySelector('.amount-controls');

    this.controlsContainer = document.querySelector('.gravity-value-controls');
    this.intervalValueText = document.querySelector('.interval');

    this.shapeList = [
      {type: 'Circle', radius: 40},
      {type: 'Ellipse', width: 50, height: 40},
      {type: 'Star'},
      {type: 'Rectangle', width: 80, height: 40},
    ];
    this.shapes = [];

    // Is used to recognise when element should be deleted or added.
    this.isShapeRemoved = false;

    // The part of constructor to create, show and set the position for number of shapes existing in application and
    // the area they are taking
    this.textContainer = new PIXI.Container();
    this.textCount = new PIXI.Text('0', {fontFamily: 'Arial', fontSize: 15, fill: 0xFFFFFF}, null);
    this.textArea = new PIXI.Text('0 px²', {fontFamily: 'Arial', fontSize: 15, fill: 0xFFFFFF}, null);
    this.textCount.position.set(10, 10);
    this.textArea.position.set(this.textCount.x + this.textCount.width + 30, 10);
    this.textContainer.addChild(this.textCount, this.textArea);
    this.textContainer.position.set(10, 10);

    this.intervalController();
    this.updateTextFields();
    this.gravityValueController();
    this.createdShapesPerSecondController()
  }

  init() {
    document.body.appendChild(this.application.view);
    this.createShape();
    this.addShapeHandler();

    this.application.start();
  }

  /**
   * Method allows us to get color for forms in 'rgb' format
   */
  getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return (r << 16) | (g << 8) | b;
  }

  createShape(x, y) {
    const randomShape = this.shapeList[Math.floor(Math.random() * this.shapeList.length)];
    const graphics = new PIXI.Graphics();
    graphics.type = randomShape.type;
    graphics.beginFill(this.getRandomColor());

    if (randomShape.type === 'Ellipse') {
      graphics.drawEllipse(0, 0, randomShape.width, randomShape.height);
    } else if (randomShape.type === 'Circle') {
      graphics.radius = randomShape.radius
      graphics.drawCircle(0, 0, randomShape.radius);
    } else if (randomShape.type === 'Star') {
      this.drawStar(graphics);
    } else {
      graphics.drawRect(0, 0, randomShape.width, randomShape.height);
    }

    graphics.endFill();

    // Condition defines the position of newly created shape.
    // Position may be created either randomly or by given coordinates from 'addShapeHandler' method
    if (x === undefined && y === undefined) {
      graphics.x = Math.random() * (this.application.renderer.screen.width - 50);
      graphics.y = -100;
    } else {
      graphics.x = x;
      graphics.y = y;
    }

    graphics.interactive = true;
    graphics.buttonMode = true;
    graphics.on('click', () => {
      this.removeShapeHandler(graphics);
    });

    graphics.gravity = this.gravityValue;

    this.application.stage.addChild(graphics);
    this.application.stage.addChild(this.textContainer);
    this.shapes.push(graphics);
    this.updateTextFields();

    return this.animateShape(graphics);
  }

  removeShapeHandler(shape) {
    this.application.stage.removeChild(shape);
    this.shapes = this.shapes.filter((form) => form !== shape);
    this.isShapeRemoved = true;

    return this.updateTextFields();
  }

  updateTextFields() {
    this.textCount.text = this.shapes.length.toString();
    const totalArea = this.calculateTotalArea();
    return this.textArea.text = `${totalArea} px²`;
  }

  /**
   * The method counts the area taken by shapes in the application.
   * Each shape has its own formula to count the taken area.
   */
  calculateTotalArea() {
    let totalArea = 0;
    for (const form of this.shapes) {
      if (form.type === 'Ellipse') {
        totalArea += Math.PI * (form.width / 2) * (form.height / 2);
      } else if (form.type === 'Circle') {
        totalArea += Math.PI * Math.pow(form.radius, 2);
      } else if (form.type === 'Star') {
        totalArea += this.calculateStarArea(form);
      } else if (form.type === 'Rectangle') {
        totalArea += form.width * form.height;
      }
    }

    return Math.round(totalArea);
  }

  animateShape(shape) {
    this.application.ticker.add(() => {
      shape.y += shape.gravity;

      if (shape.y >= this.application.renderer.screen.height + shape.height) {
        this.removeShapeHandler(shape);
      }

      this.isShapeRemoved = false;
    });
  }

  /**
   * Function to draw a five-pointed star on a graphics object.
   */
  drawStar(graphics) {
    const radius = 40;

    // Iterate five times to draw the five points of the star.
    for (let i = 0; i < 5; i++) {
      // Calculate the angle for the outer point.
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;

      // Calculate the x and y coordinates of the outer point.
      const xPoint = graphics.x + Math.cos(angle) * radius;
      const yPoint = graphics.y + Math.sin(angle) * radius;

      // If it's the first point, move to it; otherwise, draw a line to it.
      if (i === 0) {
        graphics.moveTo(xPoint, yPoint);
      } else {
        graphics.lineTo(xPoint, yPoint);
      }

      // Calculate the angle for the inner point (between outer points).
      const innerAngle = angle + (Math.PI * 2) / 10;

      // Calculate the x and y coordinates of the inner point.
      const xInnerPoint = graphics.x + Math.cos(innerAngle) * (radius / 2);
      const yInnerPoint = graphics.y + Math.sin(innerAngle) * (radius / 2);

      // Draw a line from the outer point to the inner point.
      graphics.lineTo(xInnerPoint, yInnerPoint);
    }
  }

  /**
   * The method calculates the area taken by 'Star'.
   * Need it to be as separate method because the 'Star' is created manually.
   * @returns {number}
   */
  calculateStarArea() {
    const radius = 40;

    // Calculate the area of the pentagon (outer boundary)
    const pentagonArea = (5 / 4) * radius * radius * (1 / Math.tan(Math.PI / 5));

    // Calculate the area of one isosceles triangle
    const triangleBase = 2 * radius * Math.sin(Math.PI / 5); // The base of each triangle
    const triangleHeight = radius * Math.cos(Math.PI / 5); // The height of each triangle
    const triangleArea = (1 / 2) * triangleBase * triangleHeight;

    // Calculate the total area of all five triangles
    const totalTrianglesArea = 5 * triangleArea;

    // Calculate the total area of the star (pentagon + triangles)
    return pentagonArea + totalTrianglesArea;
  }

  addShapeHandler() {
    this.application.view.addEventListener('click', (event) => {
      const x = event.clientX - this.application.view.getBoundingClientRect().left;
      const y = event.clientY - this.application.view.getBoundingClientRect().top;

      if (!this.isShapeRemoved) {
        this.createShape(x, y);
      }
      this.isShapeRemoved = false;
    });
  }

  /**
   * The controller regulates the number of shapes created in given by 'shapeCreationInterval' time.
   * @returns {Element}
   */
  createdShapesPerSecondController() {
    this.increaseNumberButton = document.querySelector('.add-amount');
    this.increaseNumberButton.addEventListener('click', () => this.increaseNumber());

    this.decreaseNumberButton = document.querySelector('.minus-amount');
    this.decreaseNumberButton.addEventListener('click', () => this.decreaseNumber());

    this.shapesPerSecondText = document.querySelector('.amount');
    this.shapesPerSecondText.textContent = `Created ${this.shapesPerSecondNumber} shape/seconds`;

    this.numberContainer.appendChild(this.increaseNumberButton);
    this.numberContainer.appendChild(this.decreaseNumberButton);
    this.numberContainer.appendChild(this.shapesPerSecondText);

    return document.body.appendChild(this.numberContainer);
  }

  animateShapesPerSecond() {
    let startTime = null;
    let createdShapes = 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const deltaTime = currentTime - startTime;

      if (deltaTime >= this.shapeCreationInterval && createdShapes < this.shapesPerSecondNumber) {
        this.createShape();
        createdShapes++;
        startTime = currentTime;
      }

      if (createdShapes < this.shapesPerSecondNumber) {
        requestAnimationFrame(animate);
      }
    };

    animate(null);
  }

  startShapeCreationInterval() {
    this.animateShapesPerSecond();
  }

  increaseNumber() {
    this.shapesPerSecondNumber += 1;
    this.startShapeCreationInterval(); // Restart the creation interval
    return this.updateShapesPerSecondText();
  }

  decreaseNumber() {
    this.shapesPerSecondNumber -= 1;
    if (this.shapesPerSecondNumber <= 1) {
      this.shapesPerSecondNumber = 1;
    }
    this.startShapeCreationInterval(); // Restart the creation interval
    return this.updateShapesPerSecondText();
  }

  /**
   * Changes HTML for shapes created per second.
   */
  updateShapesPerSecondText() {
    return this.shapesPerSecondText.textContent = `Created ${this.shapesPerSecondNumber} shape/seconds`;
  }

  /**
   * The controller regulates the speed of shapes.
   * @returns {Element}
   */
  gravityValueController() {
    this.increaseGravityButton = document.querySelector('.add-gravity-value');
    this.increaseGravityButton.addEventListener('click', () => this.increaseGravity());

    this.decreaseGravityButton = document.querySelector('.minus-gravity-value');
    this.decreaseGravityButton.addEventListener('click', () => this.decreaseGravity());

    this.gravityValueDisplay = document.querySelector('.gravity-value');
    this.gravityValueDisplay.textContent = `Gravity Value: ${this.gravityValue}`;

    this.controlsContainer.appendChild(this.increaseGravityButton);
    this.controlsContainer.appendChild(this.decreaseGravityButton);
    this.controlsContainer.appendChild(this.gravityValueDisplay);

    return document.body.appendChild(this.controlsContainer);
  }

  increaseGravity() {
    this.gravityValue += 0.1;
    this.updateGravityForShapes();
    return this.updateGravityValue();
  }

  decreaseGravity() {
    this.gravityValue -= 0.1;
    if (this.gravityValue < 0.1) {
      this.gravityValue = 0.5;
    }
    this.updateGravityForShapes();
    return this.updateGravityValue();
  }

  updateGravityForShapes() {
    for (const shape of this.shapes) {
      shape.gravity = this.gravityValue;
    }
  }

  /**
   * Changes HTML for gravity value
   */
  updateGravityValue() {
    return this.gravityValueDisplay.textContent = `Gravity Value: ${parseFloat(this.gravityValue).toFixed(1)}`;
  }

  /**
   * The controller changes the 'shapeCreationInterval'.
   */
  intervalController() {
    const increaseIntervalButton = document.querySelector('.add-interval');
    const decreaseIntervalButton = document.querySelector('.minus-interval');

    let lastFrameTime = performance.now();
    this.targetInterval = this.shapeCreationInterval;

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= this.targetInterval && !this.isShapeRemoved) {
        this.createShape();
        lastFrameTime = currentTime;
      }

      requestAnimationFrame(animate);
    };

    animate(lastFrameTime);

    this.setIntervalText();

    increaseIntervalButton.addEventListener('click', () => {
      this.updateInterval(1000);
    });

    decreaseIntervalButton.addEventListener('click', () => {
      this.updateInterval(-1000);
    });
  }

  updateInterval(valueChange) {
    this.shapeCreationInterval += valueChange;

    if (this.shapeCreationInterval <= 1000) {
      this.shapeCreationInterval = 1000;
    }

    this.targetInterval = this.shapeCreationInterval;

    this.setIntervalText();
  }

  /**
   * Changes HTML for interval
   */
  setIntervalText() {
    const interval = this.shapeCreationInterval.toString();
    this.intervalValueText.textContent = `Interval of shape creation is ${interval} milliseconds`;
  }

}

const pixiApp = new PIXI.Application({
  view: document.getElementById('canvas'),
  backgroundColor: '#002433',
});
const app = new appClass(pixiApp, 0.5, 1000);

app.init();
