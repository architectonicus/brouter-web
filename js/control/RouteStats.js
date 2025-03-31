class RouteStats  {
	
    constructor(parentElement) {

        this.parentElement = parentElement;

    }

    update(routeData){
        console.log('updating.... ', routeData)
        this.parentElement.find('[data-distance]').html(routeData.distance);
    }

}
      