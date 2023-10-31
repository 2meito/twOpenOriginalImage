((xhr_prototype) => {
'use strict';

const
    version = "0.1.0",
    DEBUG = false;

if (window?.xhr_monitor?.version !== undefined) {
    return;
}

const
    original_prototype_open = xhr_prototype.open,
    original_prototype_setRequestHeader = xhr_prototype.setRequestHeader,
    original_prototype_send = xhr_prototype.send,
    monitor_info_map = Object.create(null);

xhr_prototype.open = function (method, url, async, user, password) {
    const
        xhr = this;
    
    (() => {
        if (async === false) {
            return;
        }
        
        const
            target_monitor_infos = Object.entries(monitor_info_map).filter(([monitor_id, monitor_info]) => {
                if (! (monitor_info.method_list ?? ['GET',]).includes((method ?? 'GET').toUpperCase())) {
                    return false;
                }
                if (! new RegExp(monitor_info.url_filter_reg).test(url ?? '')) {
                    return false;
                }
                return true;
            });
        
        if (target_monitor_infos.length < 1) {
            return;
        }
        
        xhr.addEventListener('readystatechange', function (event) {
            if (xhr.readyState != 4) {
                return;
            }
            
            const
                request_headers = xhr.__request_headers || {},
                request_payload = xhr.__payload || null,
                response_url = xhr.responseURL,
                response_headers = (xhr.getAllResponseHeaders() ?? '').split(/\r?\n/).reduce((headers, header) => {
                    if (header.trim() == '') {
                        return headers;
                    }
                    const
                        [name, value] = header.split(/:\s*/, 2);
                    headers[name] = value;
                    return headers;
                }, {}),
                response = xhr.response,
                data = {
                    url,
                    method,
                    request_headers,
                    request_payload,
                    response_url,
                    response_headers,
                    response,
                };
            
            switch (xhr.responseType) {
                case '':
                case 'text' : {
                    const
                        response_text = xhr.responseText;
                    data.response_text = response_text;
                    try {
                        data.response_object = JSON.parse(response_text);
                    }
                    catch (error) {
                    }
                    break;
                }
                case 'json' : {
                    data.response_object = response;
                    try {
                        data.response_text = xhr.responseText;
                    }
                    catch (error) {
                    }
                    break;
                }
                default : {
                    break;
                }
            }
            
            target_monitor_infos.map(([monitor_id, monitor_info]) => {
                try {
                    window.postMessage(Object.assign(data, {
                        monitor_id,
                    }), window.location.origin);
                }
                catch (error) {
                    console.error('[xhr_monitor]', error);
                }
            });
        });
    })();
    
    return original_prototype_open.apply(xhr, arguments);
};

xhr_prototype.setRequestHeader = function (header, value) {
    const
        xhr = this;
    
    (xhr.__request_headers = xhr.__request_headers ?? {})[header.toLowerCase()] = value;
    
    return original_prototype_setRequestHeader.apply(xhr, arguments);
};

xhr_prototype.send = function (payload) {
    const
        xhr = this;
    
    xhr.__payload = payload;
    
    return original_prototype_send.apply(xhr, arguments);
};

window.xhr_monitor = {
    version,
    
    add_monitor : (monitor_id, url_filter_reg, method_list = ['GET',]) => {
        const
            monitor_info = {
                monitor_id,
                url_filter_reg,
                method_list,
            };
        monitor_info_map[monitor_id] = monitor_info;
        if (DEBUG) console.debug('[xhr_monitor] add_monitor():', monitor_info);
    },
    
    delete_monitor : (monitor_id) => {
        const
            monitor_info = monitor_info_map[monitor_id];
        if (DEBUG) console.debug('[xhr_monitor] delete_monitor():', monitor_info);
        if (monitor_info) {
            delete monitor_info_map[monitor_id];
        }
    }
};

})(window.XMLHttpRequest.prototype);
