export const helpTexts = {
    help1: {
      heading: "How to use:",
      body: `
      You are coming to this page because you want to link two pieces of leather such 
      that if a certain amount is sold online, a certain amount of stock is automatically reduced in-store (and vice versa). 
      This ensures stock levels online and in-store are instantly accurate the <strong>moment</strong> 
      ANY leather sale goes through. <br></br><strong>E.g.</strong><br></br>You sell kangaroo dry black in-store 
      for $154.00 per square metre. You sell it for $92.00 per piece online, meaning each sale is ~0.59 square metres, 
      based on the price you've set. If you make a sale of 3x online, in-store stock should be reduced by at 
      least 1.77 sqm (3 * 0.59sqm). If you make a sale in-store of 1.5 sqm, that's equivalent to 2.54 units of online stock, 
      thus we need to reduce online stock by at least 3 to be safe.<br></br><strong>THEREFORE</strong><br></br>Prices are the 
      MOST important aspect. To keep stock balancing simple, PRICES are used to calculate the correct balance between online 
      and in-store. So if you sell a leather for $7 per sqft, the price you set online should primarily be determined by the 
      average square footage per sale, multiplied by this $7 (give or take any small amount). <br></br>
      <strong>Step 1</strong><br></br>Decide on prices for online and in-store leather pieces. This needs to be set within Square. 
      <br></br><strong>Step 2</strong><br></br>Come back to this page and on the LEFT side, find the in-store version 
      of the leather product.<br></br><strong>Step 3</strong><br></br>On the RIGHT side, find the online version of the 
      leather product<br><br>Now you are done - that row of leather products will be linked and will automatically adjust 
      when sales go through.<br><br><strong>NOTE:</strong> When adding a new row, ensure you click the 'Force' button when 
      you're done. Read more about what this does by clicking 'What does the 'Force' button do?'
      `,
      button: "OK - Makes sense :)"
    },
    help2: {
      heading: "Force button:",
      body: `
      Purpose: Used to forcibly update online stock levels to be immediately accurate. This is most important when adding or 
      modifying a row on this page in order to make sure stock levels are correct immediately<br><br><strong>Before clicking 
      any force button, please ensure the following are set within Square:</strong><br><br>
      <strong>1)</strong> In-store leather STOCK is up-to-date<br><br>
      <strong>2)</strong> In-store leather PRICE is up-to-date <br><br>
      <strong>3)</strong> Online leather PRICE is up-to-date<br><br><br> 
      THEN the force button for each row will do the following:<br><br>
      <strong>1) </strong>Grabs that row's CURRENT in-store leather stock level<br><br>
      <strong>2) </strong>Determines the equivalent online stock level<br><br>
      <strong>3) </strong>Sends the online stock adjustment to Square, and informs you of the change
      `,
      button: "OK - Makes sense :)"
    }
};

