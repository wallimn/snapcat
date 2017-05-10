
function Snapcat(paper,data,options){
	this.options={
			centerX:100,
			centerY:100,
			bigRadius:70,
			smallRadius:40,
			leafClickHandler:function(json){
				alert("id="+json.id+", data="+json.data);
			},
			colors:["#fa3e3e","#fa9c3e","#fafa3e","#9cfa3e","#3efa3e","#3efa9c","#3efafa","#3e9cfa","#3e3efa","#9c3efa"]
	};
	
	if(options){
		jQuery.extend(this.options,options);
	}
	
	this.paper = paper;
	
	this.data = data;
	
	var exitPathDef = "M"+this.options.centerX+","+this.options.centerY+" Q"+this.options.centerX+" 0,0 0";
	var enterPathDef="M0 0,Q0 "+this.options.centerY+","+this.options.centerX+" "+this.options.centerY;
	//退出路径，内部变量
	this.exitPath = paper.path(exitPathDef).attr({fill:'none'});
	//进行路径，内部变量
	this.enterPath = paper.path(enterPathDef).attr({fill:'none'});
	
	this.getLevelColor=function(level){
		if(level>=this.options.colors.length)return "#f00";
		else return this.options.colors[level];
	};
	
	//根据ID获取数据
	this.getDataById=function (id){
		for(var i=0; i<this.data.length; i++){
			if(this.data[i].id==id)return this.data[i];
		}
		return null;
	};
	
	
	this.getDataByPid=function(id){
		var result=[];
		for(var i=0; i<this.data.length; i++){
			if(this.data[i].pid==id)result.push(this.data[i]);
		}
		return result;
	};
	
	
	this.getLevel=function(id){
		var level = 0;
		var data = this.getDataById(id);
		if(!data)return level;
		
		while(data.pid!=0){
			level++;
			data = this.getDataById(data.pid);
		}
		return level;
	};
	
	
	
	
	//内部私用函数
	function drawMainCat(cx,cy,r,id,millisec){
		var result = {};
		var data = this.getDataById(id);
		var level = this.getLevel(id);
		result.circle=this.paper.circle(cx,cy,r).attr({
			fill:this.getLevelColor(level),
			stroke:this.getLevelColor(level),
			strokeOpacity:0.75,
			r:0,
			"data-id":data.id,
			"data-pid":data.pid,
			strokeWidth:8
		});
		result.text = paper.text(cx,cy,data.label)
						.attr({"opacity":0,"data-id":data.id,"data-pid":data.pid});
		var bbox = result.text.getBBox();
		var matrix = new Snap.Matrix();
		matrix.translate(-bbox.width/2, bbox.height/2);
		result.text.transform(matrix);
		
		if(millisec){
			result.circle.animate({r:r},millisec*9/10,mina.bounce,function(){
				result.text.animate({opacity:1},millisec/10,mina.bounce,function(){
	    		});
	    	});
		}
		else{
			result.circle.attr({r:r});
			result.text.attr({opacity:1});
		}
		
		return result;
	}

	//绘制子类
	function drawSubCat(cx,cy,r1,r2,id,timeOutMillisec,dualMillisec){
		var self = this;//在内部函数中使用
		//显示子类
		var data = this.getDataByPid(id);
		var level = this.getLevel(id);
		if(!data || data.length==0)return;
        var x,y;
        var distance=r1+r2+10;
        var subcircles = this.paper.group();
        var subcircle,subtext,matrix;
        var datalen = data.length;
        var result = [];
        for(var i=0; i<datalen; i++){
        	x = distance*Math.sin(360*i*Math.PI/180/datalen)+this.options.centerX;
        	y = distance*Math.cos(360*i*Math.PI/180/datalen)+this.options.centerY;
        	subcircle=paper.circle(x,y,0).attr({"data-id":data[i].id,"data-pid":data[i].pid,"data-idx":i,"data-data":data[i].data});
        	subcircles.add(subcircle);
        	subtext = paper.text(x,y,data[i].label).attr({"data-id":data[i].id,"data-pid":data[i].pid,"data-data":data[i].data,opacity:0,"data-idx":i});
        	bbox = subtext.getBBox();
        	matrix = new Snap.Matrix();
        	matrix.translate(-bbox.width/2,bbox.height/2);
        	subtext.transform(matrix);
        	result.push({circle:subcircle,text:subtext});
        	
        }
        subcircles.attr({
        	fill:this.getLevelColor(level+1),
        	stroke:this.getLevelColor(level+1),
        	strokeOpacity:0.75,
        	strokeWidth:8
        });
        
        
    	if(timeOutMillisec && dualMillisec){
    		setTimeout(function(){
    			var circle,text;
    			for(var i=0; i<datalen; i++){
    				Snap($("circle[data-id="+data[i].id+"]")[0]).animate({r:r2},dualMillisec*9/10,mina.bounce,function(){
    					var id = this.node.getAttribute("data-id");
    					Snap($("text[data-id="+id+"]")[0]).animate({opacity:1},dualMillisec/10,mina.bounce);
    				});
    			}
    		},timeOutMillisec);
    	}
    	else{
			for(var i=0; i<datalen; i++){
				Snap($("circle[data-id="+data[i].id+"]")[0]).attr({r:r2});
				Snap($("text[data-id="+data[i].id+"]")[0]).attr({opacity:1});
			}
    	}
        
    	
    	
    	//设置事件
    	var clickHandler = function(){
			var idx = this.node.getAttribute("data-idx");
			var pid = this.node.getAttribute("data-pid");
			var id = this.node.getAttribute("data-id");
			var catdata = this.node.getAttribute("data-data");
			
			if(self.getDataByPid(id).length==0){
				self.options.leafClickHandler({id:id,data:catdata});
				return;
			}
			
			$("circle[data-idx!="+idx+"][data-pid="+pid+"]").remove();
			$("text[data-idx!="+idx+"][data-pid="+pid+"]").remove();
			//paper.selectAll("circle[data-id="+pid+"],text[data-id="+pid+"]").remove();
			var length = Snap.path.getTotalLength(self.exitPath);
			var circle = Snap($("circle[data-id="+pid+"]")[0]);
			var text = Snap($("text[data-id="+pid+"]")[0]);
			//移走大圆
			Snap.animate(0,length,function(val){
				var point = Snap.path.getPointAtLength(self.exitPath,val);
				circle.attr({cx:point.x,cy:point.y});
				text.attr({x:point.x,y:point.y});
			},timeOutMillisec,mina.easeout);
			
			//移动上左上角后，增加事件，负责移回大圆
			circle.click(function(){
				var id = this.node.getAttribute("data-id");
				$("circle[data-id!="+id+"]").remove();
				$("text[data-id!="+id+"]").remove();
				var length = Snap.path.getTotalLength(self.enterPath);
				var circle=Snap($('circle[data-id='+id+']')[0]);
				var text=Snap($('text[data-id='+id+']')[0]);
				//移回大圆
				Snap.animate(0,length,
					function(val){
	    				var point = Snap.path.getPointAtLength(self.enterPath,val);
	    				circle.attr({cx:point.x,cy:point.y});
	    				text.attr({x:point.x,y:point.y});
    				},
    				timeOutMillisec,
    				function(){
    					circle.unclick();
					});
				
				drawSubCat.bind(self)(cx,cy,r1,r2,id,timeOutMillisec,dualMillisec);
			});
			
			var subCircle = Snap($("circle[data-id="+id+"]")[0])	;
			var subText = Snap($("text[data-id="+id+"]")[0])	;
			var subPathDef = "M"+subCircle.attr("cx")+" "+subCircle.attr("cy")+" L"+self.options.centerX+" "+self.options.centerY;
			var subPath = paper.path(subPathDef);
			length = Snap.path.getTotalLength(subPath);
			//放大小圆
			Snap.animate(self.options.smallRadius,self.options.bigRadius,
					function(val){
						subCircle.attr({r:val});
					},
					dualMillisec,mina.easeout
			);
			subText.unclick();
			subCircle.unclick();
			
			//小圆移到中心
			Snap.animate(0,length,function(val){
    				var point = Snap.path.getPointAtLength(subPath,val);
    				subCircle.attr({cx:point.x,cy:point.y});
    				subText.attr({x:point.x,y:point.y});
				},
				dualMillisec,mina.easeout,
				function(){
					drawSubCat.bind(self)(cx,cy,r1,r2,id,dualMillisec,dualMillisec);
				}
			);
		};//end of click event
    	for(var i=0; i<result.length;i++){
    		result[i].text.click(clickHandler);
    		result[i].circle.click(clickHandler);
    	}//end of for
        return result;
	}
	
	this.drawCat=function(){
		var millsec=600;
    	drawMainCat.bind(this)(this.options.centerX,this.options.centerY,this.options.bigRadius,1,millsec);
    	drawSubCat.bind(this)(this.options.centerX,this.options.centerY,this.options.bigRadius,this.options.smallRadius,1,millsec,400);
	}

}//end of Snapcat
