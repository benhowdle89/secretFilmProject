/*global jQuery, Handlebars */
jQuery(function( $ ) {
	'use strict';

	var Utils = {
		ajax: function(url, success, context){
			$.ajax({
			  type: "POST",
			  url: url,
			  dataType: 'jsonp'
			}).done(function(msg){
				success.call(context, msg);	
			});
		}
	};

	var App = {
		init: function() {
			this.apiKey = '23afca60ebf72f8d88cdcae2c4f31866';
			this.baseUrl = 'http://api.themoviedb.org/3/';
			this.imageUrl = '';
			this.films = [];
			this.actors =  [];
			this.titles = [];
			this.doRender = [];
			this.classTranslate = ['first', 'second'];
			this.cacheElements();
			this.bindEvents();
			this.setupUi();
			this.getConfig();
		},
		buildPersonSearchUrl: function(person){
			return this.baseUrl + 'search/person?query=' + person + '&api_key=' + this.apiKey; 
		},
		buildMovieListUrl: function(id){
			return this.baseUrl + 'person/' + id + '/credits?api_key=' + this.apiKey; 
		},
		buildConfigUrl: function(){
			return this.baseUrl + 'configuration?api_key=' + this.apiKey; 
		},
		getConfig: function(){
			var that = this;
			Utils.ajax(this.buildConfigUrl(), that.saveConfig, that);
		},
		saveConfig: function(json){
			this.imageUrl = json.images.base_url + 'w185/';
		},
		storeActor: function(json){
			var that = this;
			if(!json.results.length){
				that.renderEmptyResults();
				return false;
			}
			var id = json.results[0].id;
			var name = json.results[0].name;
			var profile = that.imageUrl + json.results[0].profile_path;
			var i = (this.actors.length == 1) ? 1 : 0;
			var data = {
				id: id,
				name: name,
				actorClass: this.classTranslate[i],
				profile: profile
			};
			this.actors.push(data);
			Utils.ajax(that.buildMovieListUrl(id), that.storeFilms, that);
		},
		storeFilms: function(json){
			var x = 0;
			for(x in json.cast){
				var title = json.cast[x].original_title;
				var poster = this.imageUrl + json.cast[x].poster_path;
				this.films.push({title: title, poster: poster});
			}
			this.doRender.push(true);
			if(this.doRender.length > 1){
				this.getMatches(this.films);
				if(this.films.length){
					this.renderResults();
				} else {
					this.populateErrors();
					this.renderNoResults();
				}
				
			}
		},
		populateErrors: function(){
			this.$errorFirstActor.text(this.actors[0].name);
			this.$errorSecondActor.text(this.actors[1].name);
		},
		getMatches: function(movies) {
			var temp = {}, newArr = [];
			for(var k =0;k< movies.length; k++){
			    if(temp[movies[k].title]){
			        newArr.push(movies[k]);
			    }
			    
			temp[movies[k].title] = true;
			}
			this.films = newArr;
		},
		cacheElements: function() {
			this.$films = $('#films');
			this.$actors = $('.actors');
			this.$controls = $('.controls');
			this.$noResults = $('.no-results');
			this.$yesResults = $('.yes-results');
			this.$emptyResults = $('.empty-results');
			this.$loading = $('#loading');
			this.$errorFirstActor = $('#firstActor', this.$noResults);
			this.$errorSecondActor = $('#secondActor', this.$noResults);
			this.$inputs = $('.inputs input[type="text"]');
			this.filmTemplate = Handlebars.compile( $('#film-template').html() );
			this.actorTemplate = Handlebars.compile( $('#actor-template').html() );
		},
		bindEvents: function() {
			var controls = this.$controls;
			var that = this;
			controls.on( 'click', 'button', function(){
				that.search();
			});
		},
		search: function(){
			var that = this;
			that.actors = [];
			that.films = [];
			that.titles = [];
			this.doRender = [];
			this.$inputs.each(function(){
				if($(this).val() == '') return;
				Utils.ajax(that.buildPersonSearchUrl($(this).val()), that.storeActor, that);
			});
		},
		setupUi: function(){
			this.$noResults.hide();
			this.$yesResults.hide();
			this.$emptyResults.hide();
		},
		renderResults: function(){
			this.$films.html( this.filmTemplate( this.films ) );
			this.$actors.html( this.actorTemplate( this.actors ) );
			this.$noResults.hide();
			this.$emptyResults.hide();
			this.$yesResults.show();
		},
		renderNoResults: function(){
			this.$noResults.show();
			this.$emptyResults.hide();
			this.$yesResults.hide();
		},
		renderEmptyResults: function(){
			this.$noResults.hide();
			this.$yesResults.hide();
			this.$emptyResults.show();
		}
	};

	App.init();

});