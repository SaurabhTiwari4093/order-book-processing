var express = require("express");
var router = express.Router();
var multer = require("multer");
var upload = multer();
var xml2js = require("xml-js");
var Heap = require("heap");

class Book {
  constructor(book_name) {
    this.book_name = book_name;
    this.orders = {};
    this.buy_heap = new Heap((a, b) => {
      if (a[0] === b[0]) {
        return a[1] - b[1];
      } else {
        return a[0] - b[0];
      }
    });

    this.sell_heap = new Heap((a, b) => {
      if (a[0] === b[0]) {
        return a[1] - b[1];
      } else {
        return a[0] - b[0];
      }
    });
  }

  add_order(orderId, volume, price, operation) {
    if (operation === "BUY") {
      while (
        this.sell_heap.size() > 0 &&
        this.sell_heap.peek()[0] <= price &&
        volume > 0
      ) {
        var [temp_price, temp_orderId] = this.sell_heap.pop();
        if (temp_orderId in this.orders) {
          var temp_volume = this.orders[temp_orderId][0];
          if (temp_volume >= volume) {
            temp_volume -= volume;
            this.orders[temp_orderId] = [
              temp_volume,
              temp_price,
              this.orders[temp_orderId][2],
            ];
            volume = 0;
            this.sell_heap.push([temp_price, temp_orderId]);
          } else {
            volume -= temp_volume;
            delete this.orders[temp_orderId];
          }
        }
      }

      if (volume > 0) {
        this.buy_heap.push([-price, orderId]);
      }
    } else {
      while (
        this.buy_heap.size() > 0 &&
        -this.buy_heap.peek()[0] >= price &&
        volume > 0
      ) {
        var [temp_price, temp_orderId] = this.buy_heap.pop();
        if (temp_orderId in this.orders) {
          temp_price = -temp_price;
          var temp_volume = this.orders[temp_orderId][0];
          if (temp_volume >= volume) {
            temp_volume -= volume;
            this.orders[temp_orderId] = [
              temp_volume,
              temp_price,
              this.orders[temp_orderId][2],
            ];
            volume = 0;
            this.buy_heap.push([-temp_price, temp_orderId]);
          } else {
            volume -= temp_volume;
            delete this.orders[temp_orderId];
          }
        }
      }

      if (volume > 0) {
        this.sell_heap.push([price, orderId]);
      }
    }

    if (volume > 0) {
      this.orders[orderId] = [volume, price, operation];
    }
  }

  delete_order(orderId) {
    if (orderId in this.orders) {
      delete this.orders[orderId];
    }
  }

  show() {
    console.log(`book: ${this.book_name}`);
    var buy = "Buy";
    var c = "--";
    var sell = "Sell";
    console.log(`${buy.padStart(15)}${"  " + c + "  "}${sell.padEnd(9)}`);
    console.log("====================================");

    var sells = [];
    var buys = [];

    for (var [price, orderId] of this.buy_heap.toArray()) {
      if (orderId in this.orders) {
        buys.push([this.orders[orderId][0], -price]);
      }
    }

    for (var [price, orderId] of this.sell_heap.toArray()) {
      if (orderId in this.orders) {
        sells.push([this.orders[orderId][0], price]);
      }
    }

    buys.sort((a, b) => {
      if (a[1] !== b[1]) {
        return b[1] - a[1];
      } else {
        return a[0] - b[0];
      }
    });

    sells.sort((a, b) => {
      if (a[1] !== b[1]) {
        return a[1] - b[1];
      } else {
        return a[0] - b[0];
      }
    });

    var max_len = Math.max(buys.length, sells.length);

    for (let i = 0; i < max_len; i++) {
      var buy = i < buys.length ? `${buys[i][0]}@${buys[i][1].toFixed(2)}` : "";
      var c = i < buys.length ? "--" : "";
      var sell =
        i < sells.length ? `${sells[i][0]}@${sells[i][1].toFixed(2)}` : "";
      console.log(`${buy.padStart(15)}${"  " + c + "  "}${sell.padStart(9)}`);
    }
  }
}

router.post("/", upload.single("XML"), async (req, res) => {
  try {
    var start_time = new Date();
    console.log(`\nProcessing started at: ${start_time}\n`);

    var xmlData = req.file.buffer;
    var options = { compact: false };
    var result = xml2js.xml2js(xmlData, options);
    var dataToWork = result.elements[0].elements;

    var books = {};

    for (var element of dataToWork) {
      // Process 'AddOrder' and 'DeleteOrder' elements from the XML.
      if (element.name === "AddOrder") {
        var book_name = element.attributes.book;
        var order_id = parseInt(element.attributes.orderId);
        var operation = element.attributes.operation;
        var price = parseFloat(element.attributes.price);
        var volume = parseInt(element.attributes.volume);

        if (!(book_name in books)) {
          books[book_name] = new Book(book_name);
        }
        books[book_name].add_order(order_id, volume, price, operation);
      } else if (element.name === "DeleteOrder") {
        var book_name = element.attributes.book;
        var order_id = parseInt(element.attributes.orderId);
        if (book_name in books) {
          books[book_name].delete_order(order_id);
        }
      }
    }

    var sorted_books_names = Object.keys(books).sort();

    for (var book_name of sorted_books_names) {
      books[book_name].show();
      console.log();
    }

    var completion_time = new Date();
    var duration = (completion_time - start_time) / 1000; // Duration in seconds

    console.log(`Processing completed at: ${completion_time}`);
    console.log(`Processing Duration: ${duration} seconds\n`);

    res.status(200).json({
      status: 200,
      message: "Success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: error,
    });
  }
});

module.exports = router;
