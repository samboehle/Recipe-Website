let server = require("../server");
let chai = require("chai");
let chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp); 
const { expect } = chai;
var assert = chai.assert;



describe("Server!", () => {
    it("Checking default page has correct title", done => {
        chai
          .request(server)
          .get("/")
          .end((err, res) => {
            expect(res.text).to.have.string("Sam's Project");
            done();
          });
      });

      it("Checking review addition", done => {
        chai
          .request(server)
          .post("/get_feed/review")
          .send({hidden_name: "API TESTING", review_test: "TESTING"})
          .end((err, res) => {
            console.log(res.text);
            expect(res.text).to.have.string("API TESTING");
            done();
          });
      });

});